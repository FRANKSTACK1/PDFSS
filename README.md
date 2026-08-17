# 📄 PDFSS — Image to PDF, made simple.

<p align="center">
  <strong>A fast, modern, browser-based image-to-PDF converter.</strong>
</p>

<p align="center">
  Convert your images into a PDF directly in your browser — no signup, no backend, and no database required.
</p>

<p align="center">
  <a href="https://frankstack1.github.io/PDFSS/">Live Demo</a>
  ·
  <a href="https://frankstack1.github.io/PIXORA-Tools/">PIXORA Tools</a>
  ·
  <a href="https://frankstack.com.ng/">Author</a>
</p>

---

## ✨ Overview

**PDFSS** is a simple, modern, fully client-side image-to-PDF converter.

Upload multiple images, arrange them in your preferred order, customize the PDF settings, preview the result, and download your PDF — all directly from your browser.

PDFSS does not require:

* ❌ User accounts
* ❌ Backend servers
* ❌ Databases
* ❌ Environment variables
* ❌ File uploads to a server

The entire conversion process happens on the user's device.

---

## 🚀 Features

### 📤 Image Upload

* Drag-and-drop upload
* Click-to-browse upload
* Multiple image selection
* JPG support
* JPEG support
* PNG support
* WEBP support
* Image previews

### 🖼️ Image Management

* Reorder images using drag and drop
* Keyboard-accessible move up/down controls
* Remove individual images
* Clear the entire image queue
* Display image information

### 📄 PDF Customization

Customize your generated PDF with:

* **Page Size**

  * A4
  * A3
  * Letter
  * Legal
  * Auto

* **Orientation**

  * Portrait
  * Landscape
  * Auto

* **Image Fit**

  * Fit to page
  * Fill page
  * Original size

* **Margins**

  * None
  * Small
  * Medium
  * Large

* **Output Quality**

  * Standard
  * High
  * Maximum

### 👀 PDF Preview

* Live PDF preview
* Preview updates when settings change
* Per-page navigation
* Visual page representation

### ⬇️ Download

* Generate PDF directly in the browser
* Custom PDF filename
* Instant download
* No server upload required

### ⚡ Performance

PDFSS uses browser-side Canvas processing to resize and compress large images before embedding them into the PDF.

This helps reduce memory usage and prevents unnecessarily large PDF files.

### 🌙 Dark Mode

* Light mode by default
* Dark mode support
* User preference saved using `localStorage`
* Purple brand identity maintained across both themes

### ♿ Accessibility

PDFSS is designed with accessibility in mind:

* Keyboard navigation
* Accessible controls
* Screen-reader-friendly labels
* Visible focus states
* Responsive interface

### 📱 Responsive Design

Works across:

* Desktop
* Laptop
* Tablet
* Mobile

---

## 🛠️ Tech Stack

PDFSS is intentionally lightweight and does not require a build system.

| Technology         | Purpose                        |
| ------------------ | ------------------------------ |
| HTML5              | Application structure          |
| Tailwind CSS       | UI styling                     |
| Vanilla JavaScript | Application logic              |
| jsPDF              | PDF generation                 |
| Font Awesome       | Icons                          |
| Google Fonts       | Typography                     |
| Canvas API         | Image resizing and compression |
| File API           | Local image processing         |
| LocalStorage       | Theme preference               |

### Libraries & Resources

* [jsPDF](https://github.com/parallax/jsPDF)
* [Tailwind CSS](https://tailwindcss.com/)
* [Font Awesome](https://fontawesome.com/)
* [Google Fonts](https://fonts.google.com/)

### Typography

PDFSS uses:

* **Sora** — Display headings
* **Inter** — Interface and body text
* **JetBrains Mono** — Metadata and technical information

---

## 📂 Project Structure

```text
PDFSS/
│
├── index.html
│
├── assets/
│   ├── css/
│   │   └── style.css
│   │
│   └── js/
│       └── app.js
│
└── README.md
```

---

## ⚙️ Running Locally

PDFSS does not require Node.js, PHP, a database, or any build process.

### Option 1 — Python HTTP Server

Clone the repository:

```bash
git clone https://github.com/frankstack1/PDFSS.git
```

Enter the project directory:

```bash
cd PDFSS
```

Start a local server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### Option 2 — VS Code

You can also open the project with **Visual Studio Code** and use the **Live Server** extension.

### Option 3 — Open Directly

Because PDFSS is a client-side application, you can also open:

```text
index.html
```

directly in your browser.

A local server is recommended for a more consistent development environment.

---

## 🌐 Deployment

PDFSS is a static web application and can be deployed to virtually any static hosting platform.

Compatible platforms include:

* GitHub Pages
* Netlify
* Vercel
* Cloudflare Pages
* Amazon S3
* Other static hosting providers

No backend server or database is required.

### GitHub Pages

The live version of PDFSS is available at:

**https://frankstack1.github.io/PDFSS/**

---

## 🔐 Privacy

PDFSS is designed around client-side processing.

Images are read using the browser's **File API** and displayed using `URL.createObjectURL()`.

The application does not require uploading images to a server for PDF generation.

Object URLs are revoked when images are removed from the application.

Because processing happens inside the browser, uploaded images remain in the browser's memory while they are being processed.

Clearing the image queue or closing the browser tab releases the application's references to those files.

> PDFSS does not provide an account system or database for storing uploaded images.

---

## 🔗 PIXORA Tools Ecosystem

PDFSS is part of the **PIXORA Tools** ecosystem — a collection of small, focused, browser-based utilities designed to make everyday digital tasks easier.

### 🚀 Explore PIXORA Tools

**https://frankstack1.github.io/PIXORA-Tools/**

More tools are being developed as part of the ecosystem.

---

## 🗺️ Roadmap

Future improvements may include:

* [ ] Image rotation
* [ ] Image cropping
* [ ] PDF compression
* [ ] PDF page numbering
* [ ] Custom page backgrounds
* [ ] Custom PDF metadata
* [ ] Additional image formats
* [ ] Improved PDF preview
* [ ] Additional export options
* [ ] More PIXORA Tools integrations
* [ ] Progressive Web App support

---

## 🤝 Contributing

Contributions, suggestions, bug reports, and feature requests are welcome.

### Getting Started

1. Fork the repository.
2. Clone your fork.
3. Create a new feature branch.
4. Make your changes.
5. Test the application.
6. Commit your changes.
7. Push your branch.
8. Open a Pull Request.

Example:

```bash
git clone https://github.com/frankstack1/PDFSS.git

cd PDFSS

git checkout -b feature/my-feature

git add .

git commit -m "feat: add my feature"

git push origin feature/my-feature
```

---

## 🐛 Bug Reports

If you discover a problem, please open an issue.

When reporting a bug, include:

* A clear description of the problem
* Steps to reproduce it
* Expected behavior
* Actual behavior
* Browser and version
* Device or operating system
* Screenshots or recordings where applicable

---

## 💡 Feature Requests

Have an idea for PDFSS?

Open a feature request and describe:

* The problem you want to solve
* Your proposed solution
* How the feature should work
* Any examples that could help

---

## 👨‍💻 Author

### Frankstack

**Frankstack** is a web development and technology brand focused on building modern digital experiences, web applications, and useful browser-based tools.

🌐 **Portfolio:**
https://frankstack.com.ng/

🔗 **PIXORA Tools:**
https://frankstack1.github.io/PIXORA-Tools/

---

## 📜 License

This project is licensed under the **MIT License**.

See the [`LICENSE`](LICENSE) file for more information.

---

## ⭐ Support

If you find **PDFSS** useful, consider giving the repository a ⭐ on GitHub.

It helps support the project and encourages future development.

---

<p align="center">
  <strong>PDFSS</strong>
  <br>
  Image to PDF, made simple.
</p>

<p align="center">
  Built with ❤️ by <strong>Frankstack</strong>
</p>

<p align="center">
  © 2026 Frankstack. All rights reserved.
</p>
