# PDFSS — Image to PDF, made simple.

A simple, modern, fully client-side image-to-PDF converter. No signup, no backend, no database — every image is processed and turned into a PDF directly in the visitor's browser.

## Features

- Drag-and-drop or click-to-browse upload, multiple images at once (JPG, JPEG, PNG, WEBP)
- Reorderable image queue (drag handles + keyboard-accessible move up/down buttons)
- Remove individual images or clear the whole queue
- PDF settings: page size (A4 / A3 / Letter / Legal / Auto), orientation (Portrait / Landscape / Auto), image fit (Fit to page / Fill page / Original size), margins, and output quality
- Live PDF preview that updates as settings change, with per-page navigation
- Custom filename before download
- Client-side image resizing/compression (via Canvas) before embedding, to keep large photos from freezing the tab
- Dark mode with a light default, preference saved in `localStorage`
- Fully responsive, keyboard-accessible, and screen-reader-friendly

## Tech stack

- HTML5 + Tailwind CSS (via CDN, no build step)
- Vanilla JavaScript (ES6+, no frameworks)
- [jsPDF](https://github.com/parallax/jsPDF) for PDF generation, loaded via CDN
- Font Awesome for icons, loaded via CDN
- Google Fonts: Sora (display), Inter (body), JetBrains Mono (data/metadata)

## File structure

```
pdfss/
├── index.html
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
└── README.md
```

## Running locally

No build step is required. Any static file server works:

```bash
cd pdfss
python3 -m http.server 8000
# then open http://localhost:8000
```

Or simply open `index.html` directly in a browser — everything runs client-side.

## Deploying

PDFSS is a static site. Upload the `pdfss/` folder as-is to any static host (GitHub Pages, Netlify, Vercel, S3, etc.). No server, database, or environment variables are needed.

## Privacy notes

Images are read using the File API and rendered with `URL.createObjectURL()`; they are never uploaded anywhere. Object URLs are revoked when an image is removed or the page is closed. Because this is a static, client-only app, there is no account system and nothing is written to a database — but as with any browser tab, images remain in memory until the tab is closed or the images are cleared.

## Ecosystem

PDFSS is part of the [PIXORA Tools](https://frankstack1.github.io/PIXORA-Tools/) ecosystem of small, focused browser-based utilities.

---
© 2026 PDFSS. All rights reserved.
