# Numen Network — Design Strategy & Protocol Website Redesign

## Executive Summary
This design document defines the architectural, visual, content, and interactive strategy for the complete redesign of the official **Numen Network** protocol website (`numen-network.org`).

Numen Network is a **Proof-of-Scan Layer 1 blockchain** uniting Proof-of-Work block proposal with GRANDPA BFT finality, full EVM compatibility (Chain ID `32026`), and 3D spectral surface scanning via **Spectral3D**.

### Core Positioning & Narrative Strategy
> **Numen turns scanning into proof.**
> **Proof becomes consensus.**
> **Consensus becomes a ledger for things.**

---

## 1. Audit of Legacy Website

### Current State Assessment
- **Strengths**: Lightweight architecture, zero dependencies, responsive dark/light mode, custom Canvas 3D rendering for procedural asteroid meshes.
- **Weaknesses**: Limited page depth, monolithic layout with sparse developer resources, lack of interactive protocol walkthroughs, minimal search metadata, and missing structured developer Hub.
- **UX & Information Gaps**: Developers needed direct code examples, copyable RPC configurations, interactive Proof-of-Scan pipeline demonstrations, and clear status badges distinguishing active testnet features from upcoming mainnet milestones.

---

## 2. Redesign Objectives & Deliverables

1. **Protocol Authenticity**: Accurate representation of PoScan mechanics (`nonce → deterministic 3D geometry → 4,096 spectral samples → 23D quantization → block seal`).
2. **Developer First**: Direct integration with Ethereum tooling (MetaMask, Hardhat, Foundry, ethers.js, viem, wagmi, Remix) and standard JSON-RPC endpoints.
3. **Restrained Visual Identity**: Scientific, precise, deep-space computational visual system avoiding crypto clichés (no cartoon mascots, neon speculative gradients, or fake yield claims).
4. **Strict Protocol Truth**: Unverified or future features use standardized status badges:
   - `LIVE` — verified and currently operational
   - `AVAILABLE` — verified functionality/documentation exists
   - `TESTNET` — explicitly testnet
   - `IN DEVELOPMENT` — confirmed but unfinished
   - `UPCOMING` — planned
   - `INFORMATION TO BE CONFIRMED` — cannot currently verify

---

## 3. Site Navigation & Information Architecture

- **Primary Navigation**:
  - `Protocol` (PoScan, Hybrid Consensus, Spectral3D)
  - `Developers` (RPC, Smart Contracts, Quickstart, SDKs)
  - `Network` (Stats, Mining, Node Setup)
  - `Ecosystem` (Tooling, Community, Applications)
  - `Docs` (Technical Specification & Guides)
- **Primary CTA**: `Start Building` / `Explore Network`

---

## 4. Documentation Strategy & Matrix
All strategy guidelines are detailed across specialized repository documents:
- `docs/information-architecture.md`: Full site topology and route mappings.
- `docs/brand-system.md`: Typography, color tokens, visual geometry, and status badge system.
- `docs/page-specs.md`: Detailed component layout and copy specifications for all pages.
- `docs/seo-geo.md`: Search engine and AI engine Optimization (GEO) strategy, structured metadata schema.
- `docs/accessibility.md`: WCAG 2.2 AA compliance standards, keyboard navigation, and aria specifications.
- `docs/performance.md`: Core Web Vitals targets, WebGL/Canvas rendering optimization.
- `docs/technical-architecture.md`: Modular CSS/JS architecture, vanilla HTML5 structure.
