# Technical Architecture

## Repository Structure
```
├── DESIGN_DOC.md               # Redesign design document & protocol narrative
├── README.md                   # Repository README
├── index.html                  # Homepage with Proof-of-Scan interactive simulator
├── network.html                # Protocol architecture, PoScan, & hybrid consensus
├── developers.html             # Developer Hub, EVM RPCs, code snippets & configs
├── ecosystem.html              # Ecosystem infrastructure & community links
├── docs.html                   # Technical whitepaper & node guides
├── style.css                   # Unified CSS design system & status badge tokens
├── asteroid.js                 # High-performance 3D canvas rendering engine
├── poscan-sim.js               # Interactive Proof-of-Scan pipeline simulation widget
├── robots.txt                  # Search engine crawler instructions
├── sitemap.xml                 # XML sitemap for search engines
└── docs/                       # Comprehensive design strategy documentation
    ├── information-architecture.md
    ├── brand-system.md
    ├── page-specs.md
    ├── seo-geo.md
    ├── accessibility.md
    ├── performance.md
    └── technical-architecture.md
```

## CSS System Architecture
- Native CSS Custom Properties (`:root`) for instant theme switching.
- Responsive grid and flexbox layouts with fluid clamp typography (`clamp(...)`).
- Container query / breakpoint system covering 320px, 375px, 768px, 1024px, 1440px+.
