# Korgix App Site

A standalone animated marketing landing page for Korgix. Everything it needs lives inside this directory — it can be served or deployed on its own.

## Preview locally

Serve this directory with any static file server:

```bash
# From the repo root
python3 -m http.server 8080 -d appsite

# Or from inside appsite/
cd appsite && python3 -m http.server 8080
```

Then visit `http://localhost:8080/`.

## Files

- `index.html` — Full landing page markup (includes the subscribe form, wired to Formspree).
- `styles.css` — Custom design system matching the Korgix app palette.
- `animations.js` — GSAP + ScrollTrigger scroll animations and interactions.
- `icons/Korgix.png` — App icon used by the nav, footer, and favicon.
- `sw.js` — Migration shim served at the site root: unregisters the old root-scoped PWA service worker from before the app moved to `/app/`. Not part of the landing page itself.

## Notes

- The subscribe form posts to Formspree (`https://formspree.io/f/xwvglojw`) via `fetch`, so visitors stay on the page; without JavaScript it falls back to a regular form POST.
- The "Install App" and CTA buttons link to the live PWA at `https://korgix.vercel.app/app`.
- Animations fall back gracefully if GSAP fails to load.
