import "dotenv/config";
import { Command } from "commander";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import pLimit from "p-limit";
import {
  loadMaterials,
  loadSubjects,
  subjectsFromText,
  buildPrompt,
  normalizeBg,
  normalizeStyle,
  bgSlug,
  loadBgStyles,
  buildBgPrompt,
  normalizeAspect,
  normalizeMood,
} from "./materials.ts";
import { generateImage, imageModelName } from "./gemini.ts";
import { writeGrid } from "./viewer.ts";
import { cropToAspect } from "./crop.ts";
import type { ForgeJob, ForgeResult, Subject, BgJob, BgResult } from "./types.ts";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MATERIALS_DIR = path.join(ROOT, "materials");
const SUBJECTS_DIR = path.join(ROOT, "subjects");
const BG_STYLES_DIR = path.join(ROOT, "bg-styles");
const OUTPUT_DIR = path.join(ROOT, "output");
const LEDGER_PATH = path.join(os.homedir(), ".forge-spend.json");

const COST_PER_IMAGE_USD = 0.039;

const program = new Command();
program
  .name("forge")
  .description("Batch 3D icon/letter generator + banner-background generator")
  .option("--mode <name>", "'subjects' (default, 3D icon/letter) or 'bg' (banner background)", "subjects")
  // subjects-mode flags
  .option("-s, --subjects <name>", "subjects mode: subjects file (name in subjects/ or path)")
  .option("-t, --text <string>", "subjects mode: each character becomes a subject (e.g. 'xiang26')")
  .option("-m, --materials <list>", "subjects mode: comma-separated material names, 'featured', or 'all'", "featured")
  .option("--bg <color>", "subjects mode: 'cream' (default), 'dark', 'light', or hex '#RRGGBB'", "cream")
  .option("--style <name>", "subjects mode: 'hero' (default) or 'icon'", "hero")
  // bg-mode flags
  .option("--bg-style <list>", "bg mode: comma-separated bg-style names or 'all'", "all")
  .option("--palette <colors>", "bg mode: comma-separated colors (names or hex), e.g. 'green,yellow,blue' or '#011FE5,#A98AFF'")
  .option("--aspect <ratio>", "bg mode: '9:16' (default), '16:9', '4:5', '3:4', '1:1'", "9:16")
  .option("--mood <name>", "bg mode: 'calm' (default), 'energetic', 'dramatic', 'soft'", "calm")
  .option("--no-crop", "bg mode: skip post-processing crop to target aspect ratio (keep square output)")
  // shared
  .option("-c, --concurrency <n>", "parallel requests", "3")
  .option("--dry-run", "print prompts and counts, do not call API", false)
  .option("--label <text>", "label appended to run dir", "")
  .option("--max-cost <usd>", "refuse to run if estimated cost exceeds this (USD)", "2")
  .option("--confirm", "skip the cost-gate prompt for runs above --max-cost", false)
  .parse(process.argv);

const opts = program.opts<{
  mode: string;
  subjects?: string;
  text?: string;
  materials: string;
  concurrency: string;
  bg: string;
  style: string;
  bgStyle: string;
  palette?: string;
  aspect: string;
  mood: string;
  crop: boolean;
  dryRun: boolean;
  label: string;
  maxCost: string;
  confirm: boolean;
}>();

if (opts.mode !== "subjects" && opts.mode !== "bg") {
  console.error(`\n  ✗ Invalid --mode '${opts.mode}'. Use 'subjects' or 'bg'.\n`);
  process.exit(2);
}

const concurrency = Math.max(1, parseInt(opts.concurrency, 10) || 3);
const maxCostUsd = Math.max(0, parseFloat(opts.maxCost) || 0);

interface SpendLedger {
  total_usd: number;
  total_images: number;
  runs: Array<{ at: string; images: number; usd: number; label: string }>;
}

async function readLedger(): Promise<SpendLedger> {
  try {
    const raw = await readFile(LEDGER_PATH, "utf8");
    return JSON.parse(raw) as SpendLedger;
  } catch {
    return { total_usd: 0, total_images: 0, runs: [] };
  }
}

async function appendLedger(images: number, label: string): Promise<SpendLedger> {
  const ledger = await readLedger();
  const usd = images * COST_PER_IMAGE_USD;
  ledger.total_usd = round2(ledger.total_usd + usd);
  ledger.total_images += images;
  ledger.runs.push({ at: new Date().toISOString(), images, usd: round2(usd), label });
  if (ledger.runs.length > 200) ledger.runs = ledger.runs.slice(-200);
  await writeFile(LEDGER_PATH, JSON.stringify(ledger, null, 2));
  return ledger;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

async function runSubjectsMode() {
  if (!opts.subjects && !opts.text) {
    console.error("Need either --subjects <name> or --text '<string>'. Defaulting to --subjects starter.");
    opts.subjects = "starter";
  }

  let bg: string;
  let style: ReturnType<typeof normalizeStyle>;
  try {
    bg = normalizeBg(opts.bg);
    style = normalizeStyle(opts.style);
  } catch (err) {
    console.error("\n  ✗", err instanceof Error ? err.message : err, "\n");
    process.exit(2);
  }

  const materialFilter = opts.materials.split(",").map((s) => s.trim()).filter(Boolean);
  const startedAt = new Date();
  const materials = await loadMaterials(MATERIALS_DIR, materialFilter);
  let subjects: Subject[];
  let runLabel: string;

  if (opts.text) {
    subjects = subjectsFromText(opts.text);
    runLabel = `text-${slug(opts.text)}`;
    if (subjects.length === 0) throw new Error(`--text '${opts.text}' has no usable characters`);
  } else {
    subjects = await loadSubjects(SUBJECTS_DIR, opts.subjects!);
    runLabel = opts.subjects!;
  }

  const imageCount = materials.length * subjects.length;
  const estimatedUsd = round2(imageCount * COST_PER_IMAGE_USD);
  const ledger = await readLedger();

  console.log(
    `\n  3d-icon-forge — ${materials.length} materials × ${subjects.length} subjects = ${imageCount} images`,
  );
  console.log(`  bg: ${bg}   style: ${style}   estimated cost: $${estimatedUsd.toFixed(2)}   (lifetime spend on this machine: $${ledger.total_usd.toFixed(2)} / ${ledger.total_images} images)`);
  console.log(`  model: ${imageModelName()}   concurrency: ${concurrency}${opts.dryRun ? "   [DRY RUN]" : ""}\n`);

  if (!opts.dryRun && estimatedUsd > maxCostUsd && !opts.confirm) {
    console.error(`  ✗ cost gate: $${estimatedUsd.toFixed(2)} > --max-cost $${maxCostUsd.toFixed(2)}`);
    console.error(`    re-run with --confirm  to override, or with --max-cost ${Math.ceil(estimatedUsd)}  to raise the cap.`);
    process.exit(2);
  }

  const stamp = startedAt.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const labelTail = opts.label ? `-${slug(opts.label)}` : "";
  const bgTail = bg === "cream" ? "" : `-bg-${bgSlug(bg)}`;
  const styleTail = style === "hero" ? "" : `-${style}`;
  const runDir = path.join(OUTPUT_DIR, `${stamp}-${slug(runLabel)}${styleTail}${bgTail}${labelTail}`);

  const jobs: ForgeJob[] = [];
  for (const m of materials) {
    for (const s of subjects) {
      const outPath = path.join(runDir, m.name, `${s.name}.png`);
      jobs.push({ subject: s, material: m, outPath, prompt: buildPrompt(m, s, bg, style) });
    }
  }

  if (opts.dryRun) {
    for (const j of jobs.slice(0, 2)) {
      console.log(`  --- ${j.material.name} × ${j.subject.name} ---`);
      console.log(j.prompt.split("\n").map((l) => "    " + l).join("\n"));
      console.log();
    }
    if (jobs.length > 2) console.log(`  ... and ${jobs.length - 2} more job(s)\n`);
    return;
  }

  await mkdir(runDir, { recursive: true });
  for (const m of materials) await mkdir(path.join(runDir, m.name), { recursive: true });

  await writeFile(
    path.join(runDir, "_manifest.json"),
    JSON.stringify(
      {
        startedAt: startedAt.toISOString(),
        model: imageModelName(),
        mode: "subjects",
        concurrency,
        bg,
        style,
        textInput: opts.text ?? null,
        materials: materials.map((m) => m.name),
        subjects: subjects.map((s) => s.name),
      },
      null,
      2,
    ),
  );

  const limit = pLimit(concurrency);
  let done = 0;
  let okCount = 0;
  const results: ForgeResult[] = await Promise.all(
    jobs.map((job) =>
      limit(async () => {
        try {
          const { bytes, ms } = await generateImage(job.prompt, job.outPath);
          done++;
          okCount++;
          const spent = (okCount * COST_PER_IMAGE_USD).toFixed(2);
          process.stdout.write(`  [${done}/${jobs.length}] ✓ ${job.material.name}/${job.subject.name}.png  ${(bytes / 1024).toFixed(0)}kb  ${ms}ms  ($${spent})\n`);
          return { job, ok: true, bytes, ms };
        } catch (err) {
          done++;
          const raw = err instanceof Error ? err.message : String(err);
          const msg = raw.length > 200 ? raw.slice(0, 200) + "…" : raw;
          process.stdout.write(`  [${done}/${jobs.length}] ✗ ${job.material.name}/${job.subject.name}  — ${msg}\n`);
          return { job, ok: false, error: msg };
        }
      }),
    ),
  );

  const finishedAt = new Date();
  const gridPath = await writeGrid({ runDir, materials, subjects, results, model: imageModelName(), startedAt, finishedAt });

  const ok = results.filter((r) => r.ok).length;
  const failed = results.length - ok;
  const updatedLedger = await appendLedger(ok, `${runLabel}${opts.label ? `-${opts.label}` : ""}`);
  const runUsd = round2(ok * COST_PER_IMAGE_USD);
  console.log(`\n  done — ${ok} ok, ${failed} failed in ${((finishedAt.getTime() - startedAt.getTime()) / 1000).toFixed(1)}s`);
  console.log(`  spent this run: $${runUsd.toFixed(2)}   lifetime: $${updatedLedger.total_usd.toFixed(2)} / ${updatedLedger.total_images} images`);
  console.log(`  grid: ${gridPath}`);
  console.log(`  open: open "${gridPath}"\n`);
}

async function runBgMode() {
  if (!opts.palette) {
    console.error("\n  ✗ --palette is required in bg mode. Example: --palette 'green,yellow,blue' or --palette '#011FE5,#A98AFF'\n");
    process.exit(2);
  }

  let aspect: string;
  let mood: ReturnType<typeof normalizeMood>;
  try {
    aspect = normalizeAspect(opts.aspect);
    mood = normalizeMood(opts.mood);
  } catch (err) {
    console.error("\n  ✗", err instanceof Error ? err.message : err, "\n");
    process.exit(2);
  }

  const styleFilter = opts.bgStyle.split(",").map((s) => s.trim()).filter(Boolean);
  const startedAt = new Date();
  const bgStyles = await loadBgStyles(BG_STYLES_DIR, styleFilter);
  if (bgStyles.length === 0) throw new Error("No bg-styles loaded.");

  const palette = opts.palette;
  const imageCount = bgStyles.length;
  const estimatedUsd = round2(imageCount * COST_PER_IMAGE_USD);
  const ledger = await readLedger();

  console.log(`\n  forge bg — ${bgStyles.length} style(s) = ${imageCount} image(s)`);
  console.log(`  palette: ${palette}   aspect: ${aspect}   mood: ${mood}`);
  console.log(`  estimated cost: $${estimatedUsd.toFixed(2)}   (lifetime spend: $${ledger.total_usd.toFixed(2)} / ${ledger.total_images} images)`);
  console.log(`  model: ${imageModelName()}   concurrency: ${concurrency}${opts.dryRun ? "   [DRY RUN]" : ""}\n`);

  if (!opts.dryRun && estimatedUsd > maxCostUsd && !opts.confirm) {
    console.error(`  ✗ cost gate: $${estimatedUsd.toFixed(2)} > --max-cost $${maxCostUsd.toFixed(2)}`);
    console.error(`    re-run with --confirm  to override.`);
    process.exit(2);
  }

  const stamp = startedAt.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const labelTail = opts.label ? `-${slug(opts.label)}` : "";
  const paletteSlug = slug(palette);
  const runDir = path.join(OUTPUT_DIR, `${stamp}-bg-${slug(aspect.replace(":", "x"))}-${paletteSlug}${labelTail}`);

  const jobs: BgJob[] = bgStyles.map((s) => ({
    style: s,
    palette,
    aspect,
    mood,
    outPath: path.join(runDir, `${s.name}.png`),
    prompt: buildBgPrompt(s, palette, aspect, mood),
  }));

  if (opts.dryRun) {
    for (const j of jobs.slice(0, 2)) {
      console.log(`  --- ${j.style.name} ---`);
      console.log(j.prompt.split("\n").map((l) => "    " + l).join("\n"));
      console.log();
    }
    if (jobs.length > 2) console.log(`  ... and ${jobs.length - 2} more job(s)\n`);
    return;
  }

  await mkdir(runDir, { recursive: true });

  await writeFile(
    path.join(runDir, "_manifest.json"),
    JSON.stringify(
      {
        startedAt: startedAt.toISOString(),
        model: imageModelName(),
        mode: "bg",
        concurrency,
        palette,
        aspect,
        mood,
        styles: bgStyles.map((s) => s.name),
      },
      null,
      2,
    ),
  );

  const shouldCrop = opts.crop !== false && aspect !== "1:1";
  const limit = pLimit(concurrency);
  let done = 0;
  let okCount = 0;
  const results: BgResult[] = await Promise.all(
    jobs.map((job) =>
      limit(async () => {
        try {
          const { bytes, ms } = await generateImage(job.prompt, job.outPath);
          done++;
          okCount++;
          let cropInfo = "";
          if (shouldCrop) {
            try {
              const dims = await cropToAspect(job.outPath, aspect);
              if (dims) cropInfo = ` → ${dims.width}×${dims.height}`;
            } catch (err) {
              cropInfo = ` (crop failed: ${err instanceof Error ? err.message : err})`;
            }
          }
          const spent = (okCount * COST_PER_IMAGE_USD).toFixed(2);
          process.stdout.write(`  [${done}/${jobs.length}] ✓ ${job.style.name}.png  ${(bytes / 1024).toFixed(0)}kb  ${ms}ms${cropInfo}  ($${spent})\n`);
          return { job, ok: true, bytes, ms };
        } catch (err) {
          done++;
          const raw = err instanceof Error ? err.message : String(err);
          const msg = raw.length > 200 ? raw.slice(0, 200) + "…" : raw;
          process.stdout.write(`  [${done}/${jobs.length}] ✗ ${job.style.name}  — ${msg}\n`);
          return { job, ok: false, error: msg };
        }
      }),
    ),
  );

  // Simple bg viewer: minimal HTML listing the generated bgs
  const finishedAt = new Date();
  const gridPath = path.join(runDir, "_grid.html");
  const okResults = results.filter((r) => r.ok);
  const gridHtml = `<!doctype html>
<html><head><meta charset="utf-8"/><title>BG run ${stamp}</title>
<style>
:root{color-scheme:dark}body{margin:0;font-family:-apple-system,sans-serif;background:#0a0a0b;color:#e8e8ea;padding:24px}
h1{font-size:20px;margin:0 0 6px}.meta{font-size:12px;color:#888;margin-bottom:20px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.cell{background:#141416;border-radius:10px;overflow:hidden;padding:0}
.cell img{display:block;width:100%;height:auto;background:#1d1d1f}
.cell .label{padding:10px 14px;font-size:13px;color:#d0d0d2;display:flex;justify-content:space-between}
.cell .label code{color:#888;font-size:11px}
</style></head><body>
<h1>forge bg — ${stamp}</h1>
<div class="meta">palette: ${palette} · aspect: ${aspect} · mood: ${mood} · ${okResults.length}/${results.length} ok</div>
<div class="grid">
${okResults.map((r) => `<div class="cell"><img src="${path.basename(r.job.outPath)}" alt="${r.job.style.name}"/><div class="label"><span>${r.job.style.display ?? r.job.style.name}</span><code>${r.job.style.name}</code></div></div>`).join("\n")}
</div>
</body></html>`;
  await writeFile(gridPath, gridHtml);

  const ok = okResults.length;
  const failed = results.length - ok;
  const updatedLedger = await appendLedger(ok, `bg-${aspect.replace(":", "x")}-${paletteSlug}${opts.label ? `-${opts.label}` : ""}`);
  const runUsd = round2(ok * COST_PER_IMAGE_USD);
  console.log(`\n  done — ${ok} ok, ${failed} failed in ${((finishedAt.getTime() - startedAt.getTime()) / 1000).toFixed(1)}s`);
  console.log(`  spent this run: $${runUsd.toFixed(2)}   lifetime: $${updatedLedger.total_usd.toFixed(2)} / ${updatedLedger.total_images} images`);
  console.log(`  grid: ${gridPath}`);
  console.log(`  open: open "${gridPath}"\n`);
}

async function main() {
  if (opts.mode === "bg") {
    await runBgMode();
  } else {
    await runSubjectsMode();
  }
}

main().catch((err) => {
  console.error("\n  fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
