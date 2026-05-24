export interface Material {
  name: string;
  display: string;
  tags?: string[];
  /** Description of the material surface only. The scene (background, lighting, framing) is shared across all materials. */
  material: string;
  /** Optional lighting hint to override the scene default — useful for self-illuminating materials (neon). */
  lighting?: string;
  /** Optional background hint to override the scene default — useful for materials needing dark BG (neon). */
  background?: string;
  /** Comma-separated negative cues for this material. */
  negative?: string;
}

export interface Subject {
  name: string;
  description: string;
}

export interface SubjectsFile {
  subjects: Subject[];
}

export interface ForgeJob {
  subject: Subject;
  material: Material;
  outPath: string;
  prompt: string;
}

export interface ForgeResult {
  job: ForgeJob;
  ok: boolean;
  error?: string;
  bytes?: number;
  ms?: number;
}

/** Background style for `--mode bg` — generates banner/hero backgrounds (no subject). */
export interface BgStyle {
  name: string;
  display: string;
  tags?: string[];
  /** Description of the pattern itself (stripes / blobs / mesh / etc.). */
  pattern: string;
  /** Optional palette guidance — how the colors should flow (vertical / radial / etc.). */
  palette_hint?: string;
  /** Optional texture / depth hint. */
  texture?: string;
  /** Negative cues. */
  negative?: string;
}

export interface BgJob {
  style: BgStyle;
  palette: string;
  aspect: string;
  mood: string;
  outPath: string;
  prompt: string;
}

export interface BgResult {
  job: BgJob;
  ok: boolean;
  error?: string;
  bytes?: number;
  ms?: number;
}
