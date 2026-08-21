# Accessibility Strategy (WCAG 2.2 AA)

## Accessibility Principles
1. **Keyboard Navigation**: All interactive elements (navigation links, tab buttons, copy buttons, theme toggle, interactive 3D sliders) are fully focusable and navigable via `Tab` and `Shift+Tab`. Focus states are visually highlighted with strong contrast borders.
2. **Screen Reader Support**: Semantic HTML5 tags (`<nav>`, `<main>`, `<header>`, `<section>`, `<footer>`, `<article>`) are used throughout. Visual canvases and interactive WebGL widgets include textual fallback explanations and `aria-label` or `aria-describedby` attributes.
3. **Color Contrast & Motion**: All text elements meet or exceed WCAG 2.2 AA contrast ratios (4.5:1 for normal text, 3:1 for large headings). Animations respect `prefers-reduced-motion: reduce`.
4. **Interactive Code Blocks**: Code snippets and copy buttons provide screen-reader announcements upon action.
