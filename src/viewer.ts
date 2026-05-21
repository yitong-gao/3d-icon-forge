import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { Material, Subject, ForgeResult } from "./types.ts";

export async function writeGrid(opts: {
  runDir: string;
  materials: Material[];
  subjects: Subject[];
  results: ForgeResult[];
  model: string;
  startedAt: Date;
  finishedAt: Date;
}): Promise<string> {
  const { runDir, materials, subjects, results, model, startedAt, finishedAt } = opts;
  const ok = results.filter((r) => r.ok).length;
  const failed = results.length - ok;
  const totalMs = finishedAt.getTime() - startedAt.getTime();

  const resultMap = new Map<string, ForgeResult>();
  for (const r of results) resultMap.set(`${r.job.material.name}::${r.job.subject.name}`, r);

  const css = `
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
      background: #0a0a0b; color: #e8e8ea; padding: 24px;
    }
    header { margin-bottom: 20px; }
    h1 { font-size: 20px; font-weight: 600; margin: 0 0 6px; letter-spacing: -0.01em; }
    .meta { font-size: 12px; color: #888; }
    .meta span { margin-right: 14px; }
    .grid {
      display: grid;
      grid-template-columns: 140px repeat(${subjects.length}, 1fr);
      gap: 8px;
      align-items: stretch;
    }
    .corner, .col-head, .row-head {
      font-size: 11px; color: #888; padding: 8px; display: flex;
      align-items: center; justify-content: center; text-align: center;
      letter-spacing: 0.02em; text-transform: uppercase;
    }
    .row-head { justify-content: flex-end; padding-right: 12px; font-weight: 600; color: #d0d0d2; }
    .col-head { font-weight: 600; color: #d0d0d2; border-bottom: 1px solid #222; }
    .cell {
      position: relative; aspect-ratio: 1/1; background: #141416;
      border-radius: 8px; overflow: hidden; cursor: zoom-in; transition: transform .15s;
    }
    .cell:hover { transform: scale(1.02); }
    .cell img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .cell.fail { display: flex; align-items: center; justify-content: center; color: #ff6b6b; font-size: 11px; padding: 8px; text-align: center; }
    .lightbox {
      position: fixed; inset: 0; background: rgba(0,0,0,0.92);
      display: none; align-items: center; justify-content: center;
      z-index: 100; cursor: zoom-out; padding: 40px;
    }
    .lightbox.open { display: flex; }
    .lightbox img { max-width: 90vw; max-height: 90vh; border-radius: 12px; }
    footer { margin-top: 24px; font-size: 11px; color: #555; }
  `;

  const cells: string[] = [];
  cells.push(`<div class="corner">material \\ subject</div>`);
  for (const s of subjects) cells.push(`<div class="col-head">${escapeHtml(s.name)}</div>`);
  for (const m of materials) {
    cells.push(`<div class="row-head">${escapeHtml(m.display || m.name)}</div>`);
    for (const s of subjects) {
      const r = resultMap.get(`${m.name}::${s.name}`);
      if (r?.ok) {
        const rel = path.relative(runDir, r.job.outPath);
        cells.push(
          `<div class="cell" data-src="${escapeAttr(rel)}"><img loading="lazy" src="${escapeAttr(rel)}" alt="${escapeAttr(m.name + " " + s.name)}"/></div>`,
        );
      } else {
        const err = (r?.error || "missing").slice(0, 80);
        cells.push(`<div class="cell fail">${escapeHtml(err)}</div>`);
      }
    }
  }

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>3D Icon Forge — ${startedAt.toISOString()}</title>
<style>${css}</style>
</head>
<body>
<header>
  <h1>3D Icon Forge — run grid</h1>
  <div class="meta">
    <span>${materials.length} materials × ${subjects.length} subjects = ${results.length} images</span>
    <span>✓ ${ok} ok</span>
    <span style="color:${failed ? "#ff6b6b" : "#888"}">✗ ${failed} failed</span>
    <span>${(totalMs / 1000).toFixed(1)}s</span>
    <span>model: ${escapeHtml(model)}</span>
    <span>${startedAt.toLocaleString()}</span>
  </div>
</header>
<div class="grid">
${cells.join("\n")}
</div>
<div class="lightbox" id="lb"><img id="lbimg" src="" alt=""/></div>
<footer>Click any cell to zoom. Press Esc to close.</footer>
<script>
  const lb = document.getElementById("lb");
  const lbimg = document.getElementById("lbimg");
  document.querySelectorAll(".cell[data-src]").forEach((el) => {
    el.addEventListener("click", () => {
      lbimg.src = el.getAttribute("data-src");
      lb.classList.add("open");
    });
  });
  lb.addEventListener("click", () => lb.classList.remove("open"));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") lb.classList.remove("open"); });
</script>
</body>
</html>`;

  const outPath = path.join(runDir, "_grid.html");
  await writeFile(outPath, html);
  return outPath;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
function escapeAttr(s: string): string { return escapeHtml(s); }
