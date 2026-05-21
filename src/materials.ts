import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import type { Material, Subject, SubjectsFile } from "./types.ts";

const DEFAULT_LIGHTING = "large soft key light from upper-left, gentle ambient fill from the front, subtle cool rim light from upper-right";
const DEFAULT_BACKGROUND = "smooth seamless soft warm off-white backdrop, very gentle gradient from pale cream at the top to pure white at the bottom, no texture, no visible horizon, very soft contact shadow directly below the subject";
const SHARED_FRAMING = "centered composition, square 1:1 frame, the subject occupies ~58% of the canvas with generous breathing room on all sides. Premium product photography. Hyper-detailed 3D render, octane-quality, photoreal materials, crisp edges, no motion blur.";
const SHARED_NEGATIVE = "text label, logo, watermark, signature, multiple objects, busy background, harsh shadows touching frame edge, low quality, blurry, distorted";

export async function loadMaterials(dir: string, filter?: string[]): Promise<Material[]> {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
  const all: Material[] = [];
  for (const f of files) {
    const raw = await readFile(path.join(dir, f), "utf8");
    const m = YAML.parse(raw) as Material;
    if (!m?.name || !m?.material) {
      throw new Error(`Material ${f} missing required 'name' or 'material'`);
    }
    all.push(m);
  }
  all.sort((a, b) => a.name.localeCompare(b.name));
  if (!filter || filter.length === 0 || filter.includes("all")) return all;
  const set = new Set(filter);
  const featured = filter.includes("featured");
  const picked = all.filter((m) => set.has(m.name) || (featured && m.tags?.includes("featured")));
  const missing = filter.filter((n) => n !== "all" && n !== "featured" && !all.some((m) => m.name === n));
  if (missing.length) throw new Error(`Unknown material(s): ${missing.join(", ")}`);
  return picked;
}

export async function loadSubjects(subjectsDir: string, name: string): Promise<Subject[]> {
  const candidate = name.endsWith(".yaml") || name.endsWith(".yml") || name.includes("/")
    ? name
    : path.join(subjectsDir, `${name}.yaml`);
  const raw = await readFile(candidate, "utf8");
  const parsed = YAML.parse(raw) as SubjectsFile;
  if (!Array.isArray(parsed?.subjects)) {
    throw new Error(`Subjects file ${candidate} must have a top-level 'subjects:' array`);
  }
  return parsed.subjects;
}

/** Build subjects on-the-fly from an arbitrary string ("xiang26" → 7 single-character subjects). */
export function subjectsFromText(text: string): Subject[] {
  const chars = Array.from(text).filter((c) => /\S/.test(c));
  return chars.map((c) => ({
    name: characterToSlug(c),
    description: describeCharacter(c),
  }));
}

function characterToSlug(c: string): string {
  if (/[A-Z]/.test(c)) return `upper-${c.toLowerCase()}`;
  if (/[a-z]/.test(c)) return `lower-${c}`;
  if (/[0-9]/.test(c)) return `digit-${c}`;
  return `char-${c.charCodeAt(0).toString(16)}`;
}

function describeCharacter(c: string): string {
  if (/[A-Z]/.test(c)) return `the capital letter "${c}" as a 3D sculptural form, with classic geometric sans-serif proportions, thick chunky strokes`;
  if (/[a-z]/.test(c)) return `the lowercase letter "${c}" as a 3D sculptural form, with classic geometric sans-serif proportions, thick chunky strokes`;
  if (/[0-9]/.test(c)) return `the digit "${c}" as a 3D sculptural form, with classic geometric sans-serif proportions, thick chunky strokes`;
  return `the character "${c}" rendered as a 3D form with chunky proportions`;
}

export function buildPrompt(material: Material, subject: Subject): string {
  const lighting = material.lighting ?? DEFAULT_LIGHTING;
  const background = material.background ?? DEFAULT_BACKGROUND;
  const negative = [material.negative, SHARED_NEGATIVE].filter(Boolean).join(", ");

  return [
    `A 3D rendered icon of ${subject.description}, ${material.material}`,
    ``,
    `Lighting: ${lighting}.`,
    `Background: ${background}.`,
    `Framing: ${SHARED_FRAMING}`,
    ``,
    `Avoid: ${negative}.`,
  ].join("\n").trim();
}
