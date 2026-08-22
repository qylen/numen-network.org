# numen-network.org

Repository for [numen-network.org](https://numen-network.org), the official website of the Numen network — a Layer 1 blockchain powered by Proof of Scan, built with the Polkadot SDK.

## Structure

Pure static HTML/CSS/JS, deployed to GitHub Pages via `.github/workflows/static.yml`. No build step.

| File | Role |
| --- | --- |
| `index.html` | Narrative homepage (hero scan instrument, Proof-of-Scan walkthrough, architecture, specs, roadmap) |
| `network.html` | Technology deep-dive: PoScan work function, hybrid consensus, ASERT difficulty, Spectral3D, governance |
| `mining.html` | Mining guide: setup steps, external-miner RPC, security notes |
| `developers.html` | EVM integration: chain 320261 testnet config, snippets, precompiles, mining RPC |
| `ecosystem.html` | Verified community channels and infrastructure status |
| `docs.html` | Spec sheet, FAQ (+FAQPage JSON-LD), primary source links |
| `style.css` | Design-token system and all components |
| `main.js` | Shared behavior: theme, nav, reveals, copy buttons, scrollspy, tabs, honest live-data layer |
| `asteroid.js` / `hero-scan.js` / `poscan-sim.js` | Canvas visualizations |

## Content accuracy

All protocol parameters shown on the site are sourced from the
[numen node repository](https://github.com/numen-network/numen). Unshipped
features are explicitly labeled **In development** or **Planned**; live-data
slots render as unavailable until a real RPC endpoint is configured.

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```
