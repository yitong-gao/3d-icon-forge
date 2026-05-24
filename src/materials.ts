import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import type { Material, Subject, SubjectsFile } from "./types.ts";

const SHARED_FRAMING = "centered composition, square 1:1 frame, the subject occupies ~58% of the canvas with generous breathing room on all sides. Premium product photography. Hyper-detailed 3D render, octane-quality, photoreal materials, crisp edges, no motion blur.";
const SHARED_NEGATIVE = "text label, logo, watermark, signature, multiple objects, busy background, harsh shadows touching frame edge, low quality, blurry, distorted";

interface Scene {
  lighting: string;
  background: string;
}

const HEX_RE = /^#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

export function normalizeBg(bg: string): string {
  if (bg === "cream" || bg === "dark" || bg === "light") return bg;
  const m = HEX_RE.exec(bg);
  if (!m) throw new Error(`Invalid --bg '${bg}'. Use 'cream', 'dark', 'light', or a hex color like '#FFC1A8'.`);
  return "#" + m[1].toUpperCase();
}

export function bgSlug(bg: string): string {
  return bg.startsWith("#") ? bg.slice(1).toLowerCase() : bg;
}

export type Style = "hero" | "icon";

export function normalizeStyle(s: string): Style {
  if (s === "hero" || s === "icon") return s;
  throw new Error(`Invalid --style '${s}'. Use 'hero' or 'icon'.`);
}

function bgColorPhrase(bg: string): string {
  if (bg === "cream") return "smooth seamless soft warm off-white backdrop, very gentle gradient from pale cream at the top to pure white at the bottom, no texture, no visible horizon";
  if (bg === "dark") return "smooth seamless deep dark backdrop, gentle gradient from charcoal-navy at the top fading to near-black at the bottom, no texture";
  if (bg === "light") return "smooth seamless pure bright-white backdrop, no gradient, no texture";
  return `smooth seamless solid ${bg} colored backdrop, very subtle gradient slightly darker at the bottom for natural depth, no texture`;
}

function buildScene(bg: string, style: Style = "hero"): Scene {
  const bgBase = bgColorPhrase(bg);

  if (style === "icon") {
    // small system-icon usage: uniform soft diffuse light, no dramatic shadow, no env reflections
    return {
      lighting: "uniform soft diffuse studio lighting from multiple directions, low contrast and even illumination, gentle wraparound fill, no dramatic key or rim, no sharp specular hotspots, the subject reads clearly as a clean icon shape even at small sizes",
      background: `${bgBase}, no contact shadow at all (the subject sits cleanly on the background with no cast or contact shadow — designed for app-icon use where shadows are added at runtime by the OS / design system)`,
    };
  }

  // style === "hero" — dramatic 3D scene with shadow and environmental lighting
  if (bg === "cream") {
    return {
      lighting: "large soft warm key light from upper-left, gentle ambient fill from the front, subtle cool rim light from upper-right",
      background: `${bgBase}, very soft warm contact shadow directly below the subject`,
    };
  }
  if (bg === "dark") {
    return {
      lighting: "cool soft key light from upper-left, dim warm ambient fill, bright cool cyan-violet rim light from upper-right defining the silhouette against the dark scene, strong specular highlights on reflective surfaces",
      background: `${bgBase}, very subtle darker contact shadow below the subject (barely visible against the dark backdrop)`,
    };
  }
  if (bg === "light") {
    return {
      lighting: "bright even soft illumination, gentle key from upper-left, low overall contrast, mild ambient fill",
      background: `${bgBase}, soft cool light-grey contact shadow directly below the subject (the shadow provides the depth cue against the white)`,
    };
  }
  // hex color hero
  return {
    lighting: `studio lighting that complements a ${bg} colored background, soft key from upper-left, gentle ambient fill, subtle rim light from upper-right whose color temperature matches the background tone, environmental reflections on glossy/metallic surfaces should pick up the ${bg} backdrop color`,
    background: `${bgBase}, soft tinted contact shadow below the subject in a slightly deeper shade of ${bg}`,
  };
}

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

export function buildPrompt(material: Material, subject: Subject, bg: string = "cream", style: Style = "hero"): string {
  const scene = buildScene(bg, style);
  // material's own lighting/background overrides win — keeps ascii-art's pure-black scene intact even if --bg is set
  const lighting = material.lighting ?? scene.lighting;
  const background = material.background ?? scene.background;
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
