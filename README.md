# Pak-Tel

A polished, responsive static storefront for Pak-Tel eSIM plans.

## Run locally

Serve the repository root with any static server, for example:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Included

- Responsive Pak-Tel marketing page with plan catalog, live Google Sheet pricing, filters, sorting, compatibility checker, FAQ, and WhatsApp checkout flow.
- `logo.svg` is a local fallback wordmark. If the supplied `ptlogo.png` (or a `logo.png`, `logo.jpg`, `logo.jpeg`, or `logo.webp`) is placed in the root, the page automatically prefers that asset.
- The promotional slot between the hero and plans loads `pak-tel banner.png` from the root and falls back to a styled responsive banner if the image is unavailable.
- The right-to-left updates ticker reads the first available `Message` value from Google Sheet column O.
- `favicon.svg` provides a compact Pak-Tel browser tab icon across the storefront and legal pages.
- Plan prices load from the public Google Sheet in `script.js`; a saved snapshot is used if the sheet is unavailable.
- The WhatsApp order number is configured as `923205094993` in `script.js` and the WhatsApp links in `index.html`.
- `contact.html` includes support and administration contact options: `help@pak-tel.com` and `admin@pak-tel.com`.
