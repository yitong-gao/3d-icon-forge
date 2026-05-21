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
- **24 curated materials** (chrome, knit wool, moss-grass, glitter resin, chrome-rose-glass fusion, ASCII terminal art, …) — 16 tagged `featured` for the core vibetext set
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

# botim-style app icons × featured (~$5)
npm run forge -- --subjects botim-icons --max-cost 6 --confirm
```

When the run finishes, an HTML contact-sheet is auto-generated and its path is printed — `open` it to browse the result grid.

## Material gallery

All 24 materials, each rendered on the letter `x` for a like-for-like comparison. ⭐ marks the 16 `featured` materials that match the vibetext aesthetic (and that `--materials featured` selects by default).

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
    <td></td><td></td>
  </tr>
</table>

### Pearl & iridescent

<table>
  <tr>
    <td align="center" width="160"><img src="examples/pearl-balloon.png" width="140"/><br/><sub>⭐ <code>pearl-balloon</code></sub></td>
    <td align="center" width="160"><img src="examples/pearl-charcoal.png" width="140"/><br/><sub>⭐ <code>pearl-charcoal</code></sub></td>
    <td align="center" width="160"><img src="examples/holographic.png" width="140"/><br/><sub>⭐ <code>holographic</code></sub></td>
    <td align="center" width="160"><img src="examples/iridescent-fur.png" width="140"/><br/><sub>⭐ <code>iridescent-fur</code></sub></td>
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
    <td></td>
  </tr>
</table>

### Fabric & fuzzy

<table>
  <tr>
    <td align="center" width="160"><img src="examples/knit-wool.png" width="140"/><br/><sub>⭐ <code>knit-wool</code></sub></td>
    <td align="center" width="160"><img src="examples/shaggy-fur.png" width="140"/><br/><sub>⭐ <code>shaggy-fur</code></sub></td>
    <td align="center" width="160"><img src="examples/plush.png" width="140"/><br/><sub><code>plush</code></sub></td>
    <td></td>
  </tr>
</table>

### Natural

<table>
  <tr>
    <td align="center" width="160"><img src="examples/clay.png" width="140"/><br/><sub>⭐ <code>clay</code></sub></td>
    <td align="center" width="160"><img src="examples/moss-grass.png" width="140"/><br/><sub>⭐ <code>moss-grass</code></sub></td>
    <td></td><td></td>
  </tr>
</table>

### Special

<table>
  <tr>
    <td align="center" width="160"><img src="examples/obsidian.png" width="140"/><br/><sub><code>obsidian</code></sub></td>
    <td align="center" width="160"><img src="examples/ascii-art.png" width="140"/><br/><sub><code>ascii-art</code></sub></td>
    <td></td><td></td>
  </tr>
</table>

`ascii-art` overrides the shared cream backdrop with its own pure-black scene — it's intentionally NOT composable with the rest, useful as a standalone hero piece. `obsidian` keeps the shared cream backdrop and composes normally.

## Concepts

### Subjects = what to draw

Each subject is one item that gets rendered in every chosen material.

| Source | Use |
|---|---|
| `subjects/starter.yaml` | generic icons (heart, star, bell, gift, lock, bolt, note, cloud) |
| `subjects/botim-icons.yaml` | app icons (chat, wallet, lock, bell, …) |
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
      --max-cost <usd>        refuse if estimate exceeds this (default 2)
      --confirm               override the cost gate
      --dry-run               print prompts only, no API calls
      --label <text>          appended to the run dir name
```

## Inspiration

The vibetext aesthetic: each letter is its own material — knit wool next to chrome balloon next to glitter resin — all sharing the same cream studio backdrop. Compose names and banners by mixing-and-matching the resulting PNGs in Figma.

## License

MIT
