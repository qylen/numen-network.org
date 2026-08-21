# Page Specifications & Structural Copy — Numen Network

## 1. Homepage (`index.html`)

### Section 1: Hero
- **Badge**: `Proof-of-Scan Layer 1 · PoW × BFT`
- **Headline**: `The ledger of things.`
- **Subheadline**: `Numen turns physical and mathematical scanning into verifiable on-chain proof. 10-second block proposal, BFT finality, and standard EVM compatibility.`
- **CTAs**:
  - `Explore Network` (`#poscan`)
  - `Start Mining` (`network.html#mine`)
  - `Developer Quickstart` (`developers.html`)

### Section 2: Core Protocol Pillars
- **Card 1: Proof-of-Scan Workload**
  - Text: Each nonce seeds a deterministic 3D asteroid mesh. Sampling 4,096 surface points derives a 23-dimension spectral signature. Verifying the signature is the proof.
- **Card 2: PoW Proposes. BFT Disposes.**
  - Text: Open PoW block proposal every 10 seconds. GRANDPA votes seal blocks with irreversible finality in under 30 seconds.
- **Card 3: Native EVM Tooling**
  - Text: Chain ID 32026 behind standard Ethereum JSON-RPC. Deploy with Hardhat, Foundry, Remix, or connect via MetaMask, viem, and wagmi.
- **Card 4: Shape Is Identity (Spectral3D)**
  - Text: Rigid physical geometry produces a persistent fingerprint. Re-scanning an object yields the same HASH ID under any orientation.

### Section 3: Interactive Proof-of-Scan Pipeline Simulator
- Live interactive WebGL/Canvas controls allowing users to adjust nonce values, watch seed generation, view surface mesh triangulation, observe spectral ray casting, and see target hash evaluation.

### Section 4: Network Status & Parameters
- **Chain ID**: `32026` (`LIVE`)
- **Block Time**: `10 Seconds` (`LIVE`)
- **Finality**: `≤ 30 Seconds` (`LIVE`)
- **Block Reward**: `16 NMN` (`LIVE`)
- **Reward Halving**: `12.5M Blocks (~4 Years)` (`LIVE`)
- **Difficulty Adjustment**: `ASERT Anchor-Based` (`LIVE`)
- **Network Status**: `Testnet Alpha-0.1 → v0.2.0` (`TESTNET`)

---

## 2. Protocol Page (`network.html`)
- In-depth technical breakdown of PoScan, GRANDPA BFT consensus, ASERT difficulty formulas, and Spectral3D geometry math.
- Quickstart cards for running node releases (`./numen --chain testnet-raw.json`) and node mining.

---

## 3. Developer Hub (`developers.html`)
- Copyable network config parameters:
  - Network Name: Numen Testnet
  - RPC URL: `https://rpc.numen-network.org` / Local `http://127.0.0.1:9944`
  - Chain ID: `32026`
  - Currency Symbol: `NMN`
- One-click copy code snippets for ethers.js, viem, wagmi, and Foundry deployment.
- Mining RPC reference (`mining_getTask`, `mining_subscribeTask`, `mining_submitSeal`).

---

## 4. Ecosystem & Docs Pages (`ecosystem.html`, `docs.html`)
- Clear listing of official social channels, developer tooling, node binaries, and documentation guides.
