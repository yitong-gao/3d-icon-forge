import "dotenv/config";
import { Command } from "commander";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import pLimit from "p-limit";
import { loadMaterials, loadSubjects, subjectsFromText, buildPrompt, normalizeBg, normalizeStyle, bgSlug } from "./materials.ts";
import { generateImage, imageModelName } from "./gemini.ts";
import { writeGrid } from "./viewer.ts";
import type { ForgeJob, ForgeResult, Subject } from "./types.ts";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MATERIALS_DIR = path.join(ROOT, "materials");
const SUBJECTS_DIR = path.join(ROOT, "subjects");
const OUTPUT_DIR = path.join(ROOT, "output");
const LEDGER_PATH = path.join(os.homedir(), ".forge-spend.json");

const COST_PER_IMAGE_USD = 0.039;

const program = new Command();
program
  .name("forge")
  .description("Batch 3D icon/letter generator: subject × material → image grid")
  .option("-s, --subjects <name>", "subjects file (name in subjects/ or path)")
  .option("-t, --text <string>", "ad-hoc text mode: each character becomes a subject (e.g. 'xiang26')")
  .option("-m, --materials <list>", "comma-separated material names, 'featured', or 'all'", "featured")
  .option("-c, --concurrency <n>", "parallel requests", "3")
  .option("--bg <color>", "background: 'cream' (default), 'dark', 'light', or hex '#RRGGBB'", "cream")
  .option("--style <name>", "scene style: 'hero' (default, dramatic light + shadow) or 'icon' (uniform light, no shadow)", "hero")
  .option("--dry-run", "print prompts and counts, do not call API", false)
  .option("--label <text>", "label appended to run dir", "")
  .option("--max-cost <usd>", "refuse to run if estimated cost exceeds this (USD)", "2")
  .option("--confirm", "skip the cost-gate prompt for runs above --max-cost", false)
  .parse(process.argv);

const opts = program.opts<{
  subjects?: string;
  text?: string;
  materials: string;
  concurrency: string;
  bg: string;
  style: string;
  dryRun: boolean;
  label: string;
  maxCost: string;
  confirm: boolean;
}>();

if (!opts.subjects && !opts.text) {
  console.error("Need either --subjects <name> or --text '<string>'. Defaulting to --subjects starter.");
  opts.subjects = "starter";
}

const materialFilter = opts.materials.split(",").map((s) => s.trim()).filter(Boolean);
const concurrency = Math.max(1, parseInt(opts.concurrency, 10) || 3);
const maxCostUsd = Math.max(0, parseFloat(opts.maxCost) || 0);

let bg: string;
let style: ReturnType<typeof normalizeStyle>;
try {
  bg = normalizeBg(opts.bg);
  style = normalizeStyle(opts.style);
} catch (err) {
  console.error("\n  ✗", err instanceof Error ? err.message : err, "\n");
  process.exit(2);
}

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

async function main() {
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
        concurrency,
        bg,
        style,
        mode: opts.text ? "text" : "subjects",
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

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

main().catch((err) => {
  console.error("\n  fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
