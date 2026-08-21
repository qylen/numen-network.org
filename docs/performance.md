# Performance Strategy & Optimization

## Objectives & Targets
- Target **Core Web Vitals**: LCP < 2.0s, FID/INP < 100ms, CLS < 0.05.
- Zero external runtime dependencies: Built on native Vanilla JavaScript, HTML5, and CSS3.
- Fast First Render: Static HTML markup with pre-rendered canvas placeholders and non-blocking asynchronous script execution (`defer`).

## Graphics & Canvas Performance
- Adaptive Device Pixel Ratio (DPR capped at 2.0 to prevent GPU strain on mobile 4K/retina displays).
- Batch stroke operations for Canvas edge buckets to minimize draw calls per frame.
- Automatic animation loop pausing or reduced rate when user prefers reduced motion or when off-screen.
