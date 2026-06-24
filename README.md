# 3D Icon Forge

Batch 3D icon & letter generator — powered by **Gemini 2.5 Flash Image** (nano-banana). Built to chase the [vibetext](https://vibetext.app) mixed-media aesthetic: each subject × each material → composable images on a shared cream studio backdrop, ready to mix-and-match in Figma.

<p align="center">
  <img src="examples/knit-wool.png" width="140" alt="knit wool"/>
  <img src="examples/chrome-rose-glass.png" width="140" alt="chrome rose glass"/>
  <img src="examples/pearl-charcoal.png" width="140" alt="pearl marble with charcoal"/>
  <img src="examples/glitter-resin.png" width="140" alt="glitter resin"/>
</p>

## What it does

- Generates batches of 3D-rendered icons or letters via Gemini's nano-banana image model
- **36 curated materials** including a Middle East-coded Pattern & Heritage family (Iznik-style arabesque glass, royal-blue+marble palace, lapis ultramarine, spice market) plus chrome variants, pearl/iridescent, glass/resin, fabric, natural — 28 tagged `featured` for the core vibetext + cultural set
- All materials share a single cream/white studio backdrop, so outputs **drop straight into Figma and compose cleanly**
- Built-in cost gate + spend ledger — you don't accidentally burn $50 on a typo

## Requirements

- Node 22+ (tested on Node 25)
- **Gemini API key with paid-tier billing enabled** — nano-banana has $0 free quota
  - Get key: <https://aistudio.google.com/apikey>
  - Enable billing: <https://console.cloud.google.com/billing>
- Cost is **~$0.04 per image** at Gemini's pricing

## Quick start

```bash
git clone https://github.com/<you>/3d-icon-forge
cd 3d-icon-forge
npm install
cp .env.example .env
# open .env and paste your GEMINI_API_KEY

# canary — 2 letters × 16 featured materials, ~$1.30
npm run forge -- --text "xi"

# your full name × all featured (~$5, needs --confirm because it exceeds the $2 gate)
npm run forge -- --text "xiangyi26" --max-cost 6 --confirm

# app icons × featured (~$5)
npm run forge -- --subjects app-icons --max-cost 6 --confirm
```

When the run finishes, an HTML contact-sheet is auto-generated and its path is printed — `open` it to browse the result grid.

## Material gallery

All 36 materials, each rendered on the letter `x` for a like-for-like comparison (Pattern & Heritage materials shown on a shield silhouette to display ornate detail). ⭐ marks the 28 `featured` materials.

### Chrome & metal

<table>
  <tr>
    <td align="center" width="160"><img src="examples/polished-chrome.png" width="140"/><br/><sub>⭐ <code>polished-chrome</code></sub></td>
    <td align="center" width="160"><img src="examples/liquid-chrome.png" width="140"/><br/><sub>⭐ <code>liquid-chrome</code></sub></td>
    <td align="center" width="160"><img src="examples/chrome-balloon.png" width="140"/><br/><sub>⭐ <code>chrome-balloon</code></sub></td>
    <td align="center" width="160"><img src="examples/chrome-rose-glass.png" width="140"/><br/><sub>⭐ <code>chrome-rose-glass</code></sub></td>
  </tr>
  <tr>
    <td align="center"><img src="examples/gold-chain.png" width="140"/><br/><sub>⭐ <code>gold-chain</code></sub></td>
    <td align="center"><img src="examples/liquid-gold.png" width="140"/><br/><sub><code>liquid-gold</code></sub></td>
    <td align="center"><img src="examples/chrome-led-glow.png" width="140"/><br/><sub>⭐ <code>chrome-led-glow</code></sub></td>
    <td align="center"><img src="examples/chrome-led-tiered.png" width="140"/><br/><sub>⭐ <code>chrome-led-tiered</code></sub></td>
  </tr>
  <tr>
    <td align="center"><img src="examples/chrome-led-knurled.png" width="140"/><br/><sub>⭐ <code>chrome-led-knurled</code></sub></td>
    <td align="center"><img src="examples/chrome-led-brushed.png" width="140"/><br/><sub>⭐ <code>chrome-led-brushed</code></sub></td>
    <td align="center"><img src="examples/chrome-led-screws.png" width="140"/><br/><sub>⭐ <code>chrome-led-screws</code></sub></td>
    <td align="center"><img src="examples/steel-blue-satin.png" width="140"/><br/><sub>⭐ <code>steel-blue-satin</code></sub></td>
  </tr>
</table>

### Pearl & iridescent

<table>
  <tr>
    <td align="center" width="160"><img src="examples/pearl-balloon.png" width="140"/><br/><sub>⭐ <code>pearl-balloon</code></sub></td>
    <td align="center" width="160"><img src="examples/pearl-charcoal.png" width="140"/><br/><sub>⭐ <code>pearl-charcoal</code></sub></td>
    <td align="center" width="160"><img src="examples/pearl-mother.png" width="140"/><br/><sub>⭐ <code>pearl-mother</code></sub></td>
    <td align="center" width="160"><img src="examples/holographic.png" width="140"/><br/><sub>⭐ <code>holographic</code></sub></td>
  </tr>
  <tr>
    <td align="center"><img src="examples/iridescent-fur.png" width="140"/><br/><sub>⭐ <code>iridescent-fur</code></sub></td>
  </tr>
</table>

### Pattern & Heritage

Middle East-coded materials. Cobalt-blue anchored (deep cobalt threaded through arabesque glass, royal marble, lapis ultramarine) + cultural craft references (Ottoman mosque rose windows, Andalusian palace interiors, Persian illuminated manuscripts, spice market sensory).

<table>
  <tr>
    <td align="center" width="160"><img src="examples/arabesque-glass.png" width="140"/><br/><sub>⭐ <code>arabesque-glass</code><br/>rose-window stained glass</sub></td>
    <td align="center" width="160"><img src="examples/royal-marble.png" width="140"/><br/><sub>⭐ <code>royal-marble</code><br/>blue + marble + gold palace</sub></td>
    <td align="center" width="160"><img src="examples/lapis-pigment.png" width="140"/><br/><sub>⭐ <code>lapis-pigment</code><br/>Persian ultramarine + gold pyrite</sub></td>
    <td align="center" width="160"><img src="examples/spice-pigment.png" width="140"/><br/><sub>⭐ <code>spice-pigment</code><br/>saffron / sumac / paprika</sub></td>
  </tr>
</table>

### Glass & resin

<table>
  <tr>
    <td align="center" width="160"><img src="examples/glitter-glass.png" width="140"/><br/><sub>⭐ <code>glitter-glass</code></sub></td>
    <td align="center" width="160"><img src="examples/glitter-resin.png" width="140"/><br/><sub>⭐ <code>glitter-resin</code></sub></td>
    <td align="center" width="160"><img src="examples/rainbow-jelly.png" width="140"/><br/><sub>⭐ <code>rainbow-jelly</code></sub></td>
    <td align="center" width="160"><img src="examples/jelly.png" width="140"/><br/><sub><code>jelly</code></sub></td>
  </tr>
  <tr>
    <td align="center"><img src="examples/glass-crystal.png" width="140"/><br/><sub><code>glass-crystal</code></sub></td>
    <td align="center"><img src="examples/frosted-glass.png" width="140"/><br/><sub><code>frosted-glass</code></sub></td>
    <td align="center"><img src="examples/soap-bubble.png" width="140"/><br/><sub><code>soap-bubble</code></sub></td>
    <td align="center"><img src="examples/pixel-confetti.png" width="140"/><br/><sub>⭐ <code>pixel-confetti</code></sub></td>
  </tr>
</table>

### Fabric & fuzzy

<table>
  <tr>
    <td align="center" width="160"><img src="examples/knit-wool.png" width="140"/><br/><sub>⭐ <code>knit-wool</code></sub></td>
    <td align="center" width="160"><img src="examples/shaggy-fur.png" width="140"/><br/><sub>⭐ <code>shaggy-fur</code></sub></td>
    <td align="center" width="160"><img src="examples/plush.png" width="140"/><br/><sub><code>plush</code></sub></td>
  </tr>
</table>

### Natural

<table>
  <tr>
    <td align="center" width="160"><img src="examples/clay.png" width="140"/><br/><sub>⭐ <code>clay</code></sub></td>
    <td align="center" width="160"><img src="examples/moss-grass.png" width="140"/><br/><sub>⭐ <code>moss-grass</code></sub></td>
  </tr>
</table>

### Special

<table>
  <tr>
    <td align="center" width="160"><img src="examples/obsidian.png" width="140"/><br/><sub><code>obsidian</code></sub></td>
    <td align="center" width="160"><img src="examples/ascii-art.png" width="140"/><br/><sub><code>ascii-art</code></sub></td>
  </tr>
</table>

`ascii-art` overrides the shared cream backdrop with its own pure-black scene — it's intentionally NOT composable with the rest, useful as a standalone hero piece. `obsidian` keeps the shared cream backdrop and composes normally.

## Scene modes — `--bg` and `--style`

Two orthogonal flags control the scene around every material:

- **`--bg`** — backdrop color. `cream` (default, composable), `dark`, `light`, or a hex like `#FFC1A8`.
- **`--style`** — `hero` (default: dramatic light + shadow + environmental reflections) or `icon` (uniform diffuse light, no shadow, no dramatic reflections — for in-app system icons).

The matrix below uses the same letter `x` × the same two materials, so you can see how the scene reshapes the rendering — especially for **reflective materials**, whose highlights pick up the backdrop color.

### Matte material (`clay`) — shadow & light direction shift per scene

<table>
  <tr>
    <td align="center"><img src="examples/modes/clay-hero-cream.png" width="130"/><br/><sub><code>hero × cream</code></sub></td>
    <td align="center"><img src="examples/modes/clay-hero-dark.png" width="130"/><br/><sub><code>hero × dark</code></sub></td>
    <td align="center"><img src="examples/modes/clay-hero-coral.png" width="130"/><br/><sub><code>hero × #FFC1A8</code></sub></td>
    <td align="center"><img src="examples/modes/clay-icon-cream.png" width="130"/><br/><sub><code>icon × cream</code></sub></td>
  </tr>
</table>

### Reflective material (`liquid-chrome`) — environment reflects in the surface

<table>
  <tr>
    <td align="center"><img src="examples/modes/chrome-hero-cream.png" width="130"/><br/><sub><code>hero × cream</code></sub></td>
    <td align="center"><img src="examples/modes/chrome-hero-dark.png" width="130"/><br/><sub><code>hero × dark</code></sub></td>
    <td align="center"><img src="examples/modes/chrome-hero-coral.png" width="130"/><br/><sub><code>hero × #FFC1A8</code></sub></td>
    <td align="center"><img src="examples/modes/chrome-icon-cream.png" width="130"/><br/><sub><code>icon × cream</code></sub></td>
  </tr>
</table>

The chrome on coral picks up coral highlights; the chrome on dark gets a cool cyan rim. That's the whole point of generating per-scene — reflective 3D pasted onto a mismatched backdrop reads as a sticker, not as a 3D object that lives there.

### When to use which

| Asset role | Recommended flags |
|---|---|
| Composable vibetext letters (banners you arrange in Figma) | `--style hero --bg cream` (default) |
| Hero artwork on a known banner color | `--style hero --bg "#YOURHEX"` |
| Hero artwork on a dark UI surface | `--style hero --bg dark` |
| App system icon (small, used everywhere; runtime shadow) | `--style icon --bg cream` (or `light`) |

Note: `--style icon` produces *no* shadow on purpose — add the drop-shadow at runtime via your design system so it adapts to dark/light mode and interaction states. Materials with their own background override (`ascii-art`, etc.) ignore `--bg`.

## Concepts

### Subjects = what to draw

Each subject is one item that gets rendered in every chosen material.

| Source | Use |
|---|---|
| `subjects/starter.yaml` | generic icons (heart, star, bell, gift, lock, bolt, note, cloud) |
| `subjects/app-icons.yaml` | app icons (chat, wallet, lock, bell, …) |
| `subjects/alphabet-lower.yaml` | a–z, sans-serif chunky proportions |
| `subjects/digits.yaml` | 0–9 |
| `--text "anything"` | ad-hoc: each character becomes a subject on the fly |

### Materials = how to render

Use `--materials featured` (default) for the 16-material vibetext set, `--materials all` for everything, or `--materials liquid-chrome,clay,knit-wool` to cherry-pick.

Add a new material by dropping a YAML in `materials/`:

```yaml
name: your-material
display: Your Material
tags: [featured]   # optional — include in `--materials featured`
material: |
  Describe ONLY the surface (the scene, lighting, framing, and
  background are shared across all materials and injected automatically).
negative: things to avoid, comma separated
```

Special materials like `ascii-art` override the shared cream backdrop via `lighting:` and `background:` overrides in their YAML.

### Output

Each run creates `output/<timestamp>-<label>/`:
- `<material>/<subject>.png` — one image per material × subject cell
- `_grid.html` — auto-generated contact-sheet viewer (click cells to zoom)
- `_manifest.json` — run config

## Cost controls

**Code-layer gate** — `--max-cost` defaults to **$2**. Bigger runs are blocked unless `--confirm`:

```bash
npm run forge -- --text "xiangyi26" --max-cost 6 --confirm
```

**Spend ledger** at `~/.forge-spend.json` tracks lifetime spend across every run, including a per-run history.

**Recommended GCP setup**:
- Cloud Billing → Budgets & alerts → set a $10/month budget with 50% / 90% / 100% email alerts
- The GCP quota hard-cap is messy for newer image APIs in practice — the code gate is more reliable

## CLI reference

```
npm run forge -- [options]

  -t, --text <string>         text mode — each character is a subject
  -s, --subjects <name>       load subjects/<name>.yaml (or a path)
  -m, --materials <list>      'featured' (default), 'all', or comma list
  -c, --concurrency <n>       parallel requests (default 3)
      --bg <color>            'cream' (default), 'dark', 'light', or hex '#RRGGBB'
      --style <name>          'hero' (default, dramatic) or 'icon' (flat, no shadow)
      --max-cost <usd>        refuse if estimate exceeds this (default 2)
      --confirm               override the cost gate
      --dry-run               print prompts only, no API calls
      --label <text>          appended to the run dir name
```

## Inspiration

The vibetext aesthetic: each letter is its own material — knit wool next to chrome balloon next to glitter resin — all sharing the same cream studio backdrop. Compose names and banners by mixing-and-matching the resulting PNGs in Figma.

## License

[MIT](LICENSE) © 2026 Yitong Gao
