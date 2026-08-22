# Numen Network — Website Design System & Strategy (v2)

This document records the design strategy for `numen-network.org`, the official
website of the **Numen Network Proof-of-Scan Layer 1** blockchain (built with the
Polkadot SDK, MIT-licensed).

> Positioning: **Numen turns scanning into proof — and gives physical objects
> verifiable digital identities.**

---

## 1. Architecture

Pure static HTML/CSS/JS deployed to GitHub Pages. No build step, zero runtime
dependencies beyond two font families (Space Grotesk + Inter display/body,
IBM Plex Mono data) served by Google Fonts.

| File | Role |
| --- | --- |
| `style.css` | Complete design-token system + all components |
| `main.js` | Shared behavior: theme, nav/drawer, reveals, copy buttons, scrollspy, tabs engine, honest live-data layer (`NetworkFeed`) |
| `asteroid.js` | Ambient background canvas (deterministic icosphere body) |
| `hero-scan.js` | Hero instrument: object → scan → identity → sealed loop |
| `poscan-sim.js` | Interactive nonce → mesh → hash work-function simulator |
| `index.html` | Full narrative homepage |
| `network.html` | Technology deep-dive (PoScan, consensus, ASERT, Spectral3D, governance) |
| `mining.html` | Dedicated mining experience |
| `developers.html` | EVM integration hub (chain 320261 testnet / 320262 devnet / 32026 reserved mainnet) |
| `ecosystem.html` | Verified channels + infrastructure status |
| `docs.html` | Spec sheet, FAQ (+FAQPage JSON-LD), primary sources |

## 2. Design language — “instrument grade”

- Dark cinematic base (`#06070b`), layered surfaces, hairline borders.
- Single cyan accent (`#29d8f0`) used sparingly for scan/data/interaction.
- Space Grotesk display, Inter body, IBM Plex Mono for labels/hashes/specs.
- Motifs: viewfinder corner brackets, dotted grids, sweep lines, mono microcopy.
- Light theme supported via `[data-theme=light]` token overrides.
- All tokens live in `:root`; components consume only variables.

## 3. Status badge system (accuracy contract)

| Chip | Meaning |
| --- | --- |
| `LIVE` | Verified in the open-source runtime / releases today |
| `AVAILABLE` | Documented capability ready to use |
| `TESTNET` | Explicitly testnet-scoped |
| `IN DEVELOPMENT` | Confirmed but unfinished (e.g. explorer, mainnet prep) |
| `PLANNED` | Roadmap only (e.g. Spectral3D registry, pool protocol) |
| `SIMULATION · ILLUSTRATIVE` | Browser approximation of on-chain mechanics |

**Accuracy rule:** no invented partnerships, stats, TPS, audits, listings or
dates. Live-data cells render `—` until a real endpoint is configured via
`window.NUMEN_LIVE_RPC = ["https://…"]`.

## 4. Verified protocol facts used across copy

Block target 10 s · ASERT halflife 1800 s · GRANDPA BFT finality · reward 16 NMN,
halving every 12,500,000 blocks (~4 y) · mined-issuance cap 400 M NMN · PoScan:
4,096 samples × 23 quantized dims, domain `poscan-v1`, pinned subdivision ·
SS58 prefix 14240 · mining needs no private key (payout SS58 in header;
`mining_getTask` / `mining_subscribeTask` / `mining_submitSeal`) · OpenGov
referenda + conviction voting + treasury · Prime authority limited to runtime
upgrades and vetoes · ERC-20 balances precompile with EIP-2612 permit · v0.2.0
releases (Linux x86_64, macOS arm64).

## 5. Motion & accessibility

- Scroll reveals gated behind `html.js` so content is never hidden without JS.
- Every animation respects `prefers-reduced-motion` (static frames rendered).
- Canvas loops pause when offscreen or when the tab is hidden.
- ARIA tabs pattern with roving tabindex + arrow keys; auto-advance stops on
  first manual interaction.
- Skip link, focus-visible outlines, aria-live announcements for copy actions,
  semantic landmarks and heading order throughout.
