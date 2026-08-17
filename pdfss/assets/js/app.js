/**
 * PDFSS — client-side image to PDF converter.
 * No backend, no database. Everything happens in the browser.
 */
(() => {
  'use strict';

  /* ============================================================
   * Constants
   * ============================================================ */
  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const ACCEPTED_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
  const MAX_WARN_BYTES = 25 * 1024 * 1024; // 25MB — warn but still process

  const PAGE_SIZES_MM = {
    A4: [210, 297],
    A3: [297, 420],
    Letter: [215.9, 279.4],
    Legal: [215.9, 355.6]
  };

  const MARGIN_MM = { None: 0, Small: 10, Medium: 20, Large: 30 };

  const QUALITY_PRESETS = {
    Standard: { maxDim: 1000, jpegQuality: 0.6 },
    High: { maxDim: 1600, jpegQuality: 0.82 },
    Maximum: { maxDim: 2500, jpegQuality: 0.92 }
  };

  const PX_TO_MM = 25.4 / 96; // assume 96dpi source pixels

  /* ============================================================
   * State
   * ============================================================ */
  const state = {
    images: [], // { id, file, url, name, size, width, height }
    settings: {
      pageSize: 'A4',
      orientation: 'Auto',
      fit: 'Fit to page',
      margin: 'Small',
      quality: 'High'
    },
    previewIndex: 0,
    generating: false
  };

  let dragSourceId = null;

  /* ============================================================
   * DOM references
   * ============================================================ */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const dropzone = $('#dropzone');
  const fileInput = $('#file-input');
  const browseBtn = $('#browse-btn');
  const uploadError = $('#upload-error');

  const queueSection = $('#queue-section');
  const queueList = $('#image-queue');
  const queueCount = $('#queue-count');
  const clearAllBtn = $('#clear-all-btn');

  const settingsSection = $('#settings-section');
  const generateSection = $('#generate-section');
  const emptyStateHint = $('#empty-state-hint');

  const filenameInput = $('#filename-input');
  const generateBtn = $('#generate-btn');
  const generateBtnLabel = $('#generate-btn-label');
  const generateStatus = $('#generate-status');

  const previewStage = $('#preview-stage');
  const previewDims = $('#preview-dims');
  const previewPageIndicator = $('#preview-page-indicator');
  const previewPrev = $('#preview-prev');
  const previewNext = $('#preview-next');

  const toastRoot = $('#toast-root');
  const themeToggle = $('#theme-toggle');
  const mobileMenuBtn = $('#mobile-menu-btn');
  const mobileMenu = $('#mobile-menu');

  /* ============================================================
   * Utilities
   * ============================================================ */
  function uid() {
    return 'img-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  function isAcceptedFile(file) {
    if (ACCEPTED_TYPES.includes(file.type)) return true;
    const lower = file.name.toLowerCase();
    return ACCEPTED_EXT.some((ext) => lower.endsWith(ext));
  }

  function loadImageElement(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('This file could not be read as an image.'));
      img.src = src;
    });
  }

  function showToast(message, type = 'default') {
    const el = document.createElement('div');
    el.className = `toast ${type === 'error' ? 'toast--error' : type === 'success' ? 'toast--success' : ''}`;
    const icon = type === 'error' ? 'fa-circle-exclamation' : type === 'success' ? 'fa-circle-check' : 'fa-circle-info';
    const color = type === 'error' ? '#DC2626' : type === 'success' ? '#16A34A' : '#7C3AED';
    el.innerHTML = `<i class="fa-solid ${icon}" style="color:${color};margin-top:2px"></i><span>${escapeHtml(message)}</span>`;
    toastRoot.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      el.style.transition = 'opacity .2s ease, transform .2s ease';
      setTimeout(() => el.remove(), 220);
    }, 4200);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ============================================================
   * Theme (dark mode)
   * ============================================================ */
  function initTheme() {
    const saved = localStorage.getItem('pdfss-theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : false; // default light per spec
    setTheme(isDark, false);
  }

  function setTheme(isDark) {
    document.documentElement.classList.toggle('dark', isDark);
    themeToggle.setAttribute('aria-pressed', String(isDark));
    localStorage.setItem('pdfss-theme', isDark ? 'dark' : 'light');
  }

  themeToggle.addEventListener('click', () => {
    setTheme(!document.documentElement.classList.contains('dark'));
    renderPreview(); // preview colors depend on theme via CSS only, but re-render keeps things crisp
  });

  /* ============================================================
   * Mobile menu
   * ============================================================ */
  mobileMenuBtn.addEventListener('click', () => {
    const isOpen = !mobileMenu.classList.contains('hidden');
    mobileMenu.classList.toggle('hidden');
    mobileMenuBtn.setAttribute('aria-expanded', String(!isOpen));
  });
  $$('#mobile-menu a').forEach((a) => a.addEventListener('click', () => {
    mobileMenu.classList.add('hidden');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
  }));

  /* ============================================================
   * File intake
   * ============================================================ */
  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  ['dragenter', 'dragover'].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add('dropzone--active');
    });
  });
  ['dragleave', 'dragend'].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      if (evt === 'dragleave' && dropzone.contains(e.relatedTarget)) return;
      dropzone.classList.remove('dropzone--active');
    });
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dropzone--active');
    if (e.dataTransfer && e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
    fileInput.value = '';
  });

  async function handleFiles(fileList) {
    const files = Array.from(fileList);
    if (!files.length) return;

    hideUploadError();
    const rejected = [];
    const accepted = [];

    files.forEach((file) => {
      if (isAcceptedFile(file)) {
        accepted.push(file);
      } else {
        rejected.push(file.name);
      }
    });

    if (rejected.length) {
      showUploadError(
        `${rejected.length === 1 ? 'This file is' : 'These files are'} not supported: ${rejected.join(', ')}. Please use JPG, PNG or WEBP.`
      );
    }

    for (const file of accepted) {
      if (file.size > MAX_WARN_BYTES) {
        showToast(`"${file.name}" is quite large — PDFSS will compress it automatically to keep things smooth.`);
      }
      await addImageFile(file);
    }

    renderAll();
  }

  async function addImageFile(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImageElement(url);
      state.images.push({
        id: uid(),
        file,
        url,
        name: file.name,
        size: file.size,
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    } catch (err) {
      URL.revokeObjectURL(url);
      showToast(`Something went wrong. We couldn't process "${file.name}". Please try another file.`, 'error');
    }
  }

  function showUploadError(msg) {
    uploadError.textContent = msg;
    uploadError.classList.remove('hidden');
  }
  function hideUploadError() {
    uploadError.classList.add('hidden');
    uploadError.textContent = '';
  }

  /* ============================================================
   * Queue rendering + reorder + delete
   * ============================================================ */
  function renderQueue() {
    queueList.innerHTML = '';
    queueCount.textContent = `(${state.images.length})`;

    state.images.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'queue-item';
      li.draggable = true;
      li.dataset.id = item.id;

      li.innerHTML = `
        <span class="queue-item__handle" aria-hidden="true"><i class="fa-solid fa-grip-vertical"></i></span>
        <img class="queue-item__thumb" src="${item.url}" alt="" loading="lazy">
        <div class="queue-item__meta">
          <p class="queue-item__name" title="${escapeHtml(item.name)}">${index + 1}. ${escapeHtml(item.name)}</p>
          <p class="queue-item__sub">${formatBytes(item.size)} · ${item.width}×${item.height}px</p>
        </div>
        <div class="queue-item__actions">
          <button type="button" class="queue-item__btn" data-action="up" aria-label="Move ${escapeHtml(item.name)} earlier in the order" ${index === 0 ? 'disabled' : ''}><i class="fa-solid fa-chevron-up"></i></button>
          <button type="button" class="queue-item__btn" data-action="down" aria-label="Move ${escapeHtml(item.name)} later in the order" ${index === state.images.length - 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-down"></i></button>
          <button type="button" class="queue-item__btn queue-item__btn--danger" data-action="delete" aria-label="Remove ${escapeHtml(item.name)}"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `;

      li.addEventListener('dragstart', () => {
        dragSourceId = item.id;
        requestAnimationFrame(() => li.classList.add('dragging'));
      });
      li.addEventListener('dragend', () => {
        li.classList.remove('dragging');
        $$('.queue-item').forEach((el) => el.classList.remove('drag-over'));
        dragSourceId = null;
      });
      li.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (item.id !== dragSourceId) li.classList.add('drag-over');
      });
      li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
      li.addEventListener('drop', (e) => {
        e.preventDefault();
        li.classList.remove('drag-over');
        if (!dragSourceId || dragSourceId === item.id) return;
        reorderImages(dragSourceId, item.id);
      });

      li.querySelector('[data-action="up"]').addEventListener('click', () => moveImage(item.id, -1));
      li.querySelector('[data-action="down"]').addEventListener('click', () => moveImage(item.id, 1));
      li.querySelector('[data-action="delete"]').addEventListener('click', () => removeImage(item.id, li));

      queueList.appendChild(li);
    });
  }

  function reorderImages(sourceId, targetId) {
    const from = state.images.findIndex((i) => i.id === sourceId);
    const to = state.images.findIndex((i) => i.id === targetId);
    if (from === -1 || to === -1) return;
    const [moved] = state.images.splice(from, 1);
    state.images.splice(to, 0, moved);
    renderAll();
  }

  function moveImage(id, delta) {
    const index = state.images.findIndex((i) => i.id === id);
    const target = index + delta;
    if (index === -1 || target < 0 || target >= state.images.length) return;
    const [moved] = state.images.splice(index, 1);
    state.images.splice(target, 0, moved);
    renderAll();
  }

  function removeImage(id, liEl) {
    const item = state.images.find((i) => i.id === id);
    if (!item) return;
    liEl.classList.add('removing');
    setTimeout(() => {
      URL.revokeObjectURL(item.url);
      state.images = state.images.filter((i) => i.id !== id);
      if (state.previewIndex >= state.images.length) {
        state.previewIndex = Math.max(0, state.images.length - 1);
      }
      renderAll();
    }, 220);
  }

  clearAllBtn.addEventListener('click', () => {
    state.images.forEach((i) => URL.revokeObjectURL(i.url));
    state.images = [];
    state.previewIndex = 0;
    renderAll();
  });

  /* ============================================================
   * Settings pills
   * ============================================================ */
  function pillsIn(group) {
    return Array.from(group.querySelectorAll('.pill'));
  }
  $$('.pill-group').forEach((group) => {
    const key = group.dataset.setting;
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.pill');
      if (!btn) return;
      state.settings[key] = btn.dataset.value;
      pillsIn(group).forEach((p) => p.setAttribute('aria-pressed', String(p === btn)));
      renderPreview();
    });
  });

  filenameInput.addEventListener('input', () => {
    /* value read at generation time */
  });

  /* ============================================================
   * Page geometry helpers (shared by preview + generation)
   * ============================================================ */
  function computePageGeometry(item, settings) {
    let w, h;
    if (settings.pageSize === 'Auto') {
      const longEdge = 297;
      const ratio = item.width / item.height;
      if (ratio >= 1) { w = longEdge; h = longEdge / ratio; }
      else { h = longEdge; w = longEdge * ratio; }
    } else {
      [w, h] = PAGE_SIZES_MM[settings.pageSize];
    }

    let orientation = settings.orientation;
    if (orientation === 'Auto') {
      orientation = item.width >= item.height ? 'Landscape' : 'Portrait';
    }
    if (orientation === 'Landscape' && w < h) [w, h] = [h, w];
    if (orientation === 'Portrait' && w > h) [w, h] = [h, w];

    const margin = MARGIN_MM[settings.margin];
    const contentW = Math.max(1, w - margin * 2);
    const contentH = Math.max(1, h - margin * 2);

    return { pageW: w, pageH: h, orientation, margin, contentW, contentH };
  }

  function computeImagePlacement(item, geometry, fit) {
    const imgRatio = item.width / item.height;
    const { contentW, contentH, margin, pageW, pageH } = geometry;

    if (fit === 'Fill page') {
      return { x: margin, y: margin, w: contentW, h: contentH, crop: true, areaRatio: contentW / contentH };
    }

    if (fit === 'Original size') {
      const w = item.width * PX_TO_MM;
      const h = item.height * PX_TO_MM;
      return {
        x: (pageW - w) / 2,
        y: (pageH - h) / 2,
        w, h,
        crop: false,
        overflow: w > pageW || h > pageH
      };
    }

    // Fit to page (contain)
    const areaRatio = contentW / contentH;
    let w, h;
    if (imgRatio > areaRatio) { w = contentW; h = w / imgRatio; }
    else { h = contentH; w = h * imgRatio; }
    return {
      x: margin + (contentW - w) / 2,
      y: margin + (contentH - h) / 2,
      w, h,
      crop: false
    };
  }

  /* ============================================================
   * Live preview
   * ============================================================ */
  function renderPreview() {
    if (!state.images.length) {
      previewStage.innerHTML = '<p class="text-sm text-ink/40 dark:text-white/40">Upload images to see a live preview</p>';
      previewDims.textContent = '';
      previewPageIndicator.textContent = '1 / 1';
      previewPrev.disabled = true;
      previewNext.disabled = true;
      return;
    }

    if (state.previewIndex >= state.images.length) state.previewIndex = state.images.length - 1;
    const item = state.images[state.previewIndex];
    const geometry = computePageGeometry(item, state.settings);
    const placement = computeImagePlacement(item, geometry, state.settings.fit);

    // Scale the mm page down to fit the stage while preserving aspect ratio.
    const stageMax = 300; // px, longest side budget inside preview-stage
    const scale = stageMax / Math.max(geometry.pageW, geometry.pageH);
    const pageWpx = geometry.pageW * scale;
    const pageHpx = geometry.pageH * scale;

    previewStage.innerHTML = '';
    const pageEl = document.createElement('div');
    pageEl.className = 'preview-page';
    pageEl.style.width = `${pageWpx}px`;
    pageEl.style.height = `${pageHpx}px`;

    const badge = document.createElement('span');
    badge.className = 'preview-page__badge';
    badge.textContent = `Page ${state.previewIndex + 1}`;
    pageEl.appendChild(badge);

    if (state.settings.margin !== 'None') {
      const pad = document.createElement('div');
      pad.className = 'preview-page__pad';
      pad.style.setProperty('--pm', `${geometry.margin * scale}px`);
      pageEl.appendChild(pad);
    }

    const img = document.createElement('img');
    img.src = item.url;
    img.alt = '';
    img.style.position = 'absolute';
    img.style.left = `${placement.x * scale}px`;
    img.style.top = `${placement.y * scale}px`;
    img.style.width = `${placement.w * scale}px`;
    img.style.height = `${placement.h * scale}px`;
    img.style.objectFit = placement.crop ? 'cover' : 'fill';
    if (placement.overflow) {
      pageEl.style.overflow = 'visible';
      img.style.outline = '1px dashed rgba(220,38,38,0.5)';
    } else {
      pageEl.style.overflow = 'hidden';
    }

    pageEl.appendChild(img);
    previewStage.appendChild(pageEl);

    previewDims.textContent = `${geometry.pageW.toFixed(0)} × ${geometry.pageH.toFixed(0)} mm · ${geometry.orientation}${placement.overflow ? ' · image exceeds page at original size' : ''}`;
    previewPageIndicator.textContent = `${state.previewIndex + 1} / ${state.images.length}`;
    previewPrev.disabled = state.previewIndex === 0;
    previewNext.disabled = state.previewIndex === state.images.length - 1;
  }

  previewPrev.addEventListener('click', () => {
    if (state.previewIndex > 0) { state.previewIndex--; renderPreview(); }
  });
  previewNext.addEventListener('click', () => {
    if (state.previewIndex < state.images.length - 1) { state.previewIndex++; renderPreview(); }
  });

  /* ============================================================
   * PDF generation
   * ============================================================ */
  function resizeAndCompress(imgEl, maxDim, jpegQuality) {
    let { naturalWidth: width, naturalHeight: height } = imgEl;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(imgEl, 0, 0, w, h);
    return { dataUrl: canvas.toDataURL('image/jpeg', jpegQuality), width: w, height: h };
  }

  function coverCropCanvas(imgEl, targetRatio, jpegQuality) {
    const { naturalWidth: sw, naturalHeight: sh } = imgEl;
    const srcRatio = sw / sh;
    let cropW = sw, cropH = sh, sx = 0, sy = 0;
    if (srcRatio > targetRatio) {
      cropW = sh * targetRatio;
      sx = (sw - cropW) / 2;
    } else {
      cropH = sw / targetRatio;
      sy = (sh - cropH) / 2;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(cropW);
    canvas.height = Math.round(cropH);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgEl, sx, sy, cropW, cropH, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', jpegQuality);
  }

  async function buildPdf() {
    const { jsPDF } = window.jspdf;
    const preset = QUALITY_PRESETS[state.settings.quality];
    let doc = null;

    for (let i = 0; i < state.images.length; i++) {
      const item = state.images[i];
      const geometry = computePageGeometry(item, state.settings);
      const placement = computeImagePlacement(item, geometry, state.settings.fit);

      const sourceImg = await loadImageElement(item.url);
      const resized = resizeAndCompress(sourceImg, preset.maxDim, preset.jpegQuality);

      let finalDataUrl = resized.dataUrl;
      if (placement.crop) {
        const resizedImgEl = await loadImageElement(resized.dataUrl);
        finalDataUrl = coverCropCanvas(resizedImgEl, placement.areaRatio, preset.jpegQuality);
      }

      const orientationCode = geometry.orientation === 'Landscape' ? 'l' : 'p';

      if (!doc) {
        doc = new jsPDF({
          unit: 'mm',
          format: [geometry.pageW, geometry.pageH],
          orientation: orientationCode
        });
      } else {
        doc.addPage([geometry.pageW, geometry.pageH], orientationCode);
      }

      doc.addImage(finalDataUrl, 'JPEG', placement.x, placement.y, placement.w, placement.h, undefined, 'MEDIUM');
    }

    return doc;
  }

  generateBtn.addEventListener('click', async () => {
    if (state.generating) return;

    if (!state.images.length) {
      generateStatus.innerHTML = statusMarkup('error', 'Something went wrong', "Add at least one image before generating your PDF.");
      showToast('Please upload at least one image first.', 'error');
      return;
    }

    state.generating = true;
    generateBtn.disabled = true;
    generateBtnLabel.textContent = 'Creating your PDF...';
    generateStatus.innerHTML = statusMarkup('loading', null, 'Creating your PDF...');

    try {
      const doc = await buildPdf();
      const rawName = filenameInput.value.trim();
      const safeName = (rawName ? rawName.replace(/[^a-z0-9\-_\s]/gi, '').trim() : '') || 'pdfss-images';
      const finalName = `${safeName}.pdf`;

      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);

      generateStatus.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'flex flex-col items-center gap-4';
      wrap.innerHTML = `
        <div class="status-box status-box--success"><i class="fa-solid fa-circle-check"></i> Your PDF is ready!</div>
      `;
      const downloadBtn = document.createElement('a');
      downloadBtn.href = blobUrl;
      downloadBtn.download = finalName;
      downloadBtn.className = 'btn-primary';
      downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i> Download PDF';
      wrap.appendChild(downloadBtn);
      generateStatus.appendChild(wrap);

      showToast('Your PDF is ready to download.', 'success');

      // Auto-revoke the blob URL after a while to avoid leaking memory.
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5 * 60 * 1000);
    } catch (err) {
      console.error(err);
      generateStatus.innerHTML = statusMarkup('error', 'Something went wrong', "We couldn't generate your PDF. Please try again or use a different image.");
      showToast("We couldn't generate your PDF. Please try again.", 'error');
    } finally {
      state.generating = false;
      generateBtn.disabled = false;
      generateBtnLabel.textContent = 'Generate PDF';
    }
  });

  function statusMarkup(type, title, text) {
    const cls = type === 'loading' ? 'status-box--loading' : type === 'error' ? 'status-box--error' : 'status-box--success';
    const icon = type === 'loading' ? '<span class="spinner"></span>' : type === 'error' ? '<i class="fa-solid fa-triangle-exclamation"></i>' : '<i class="fa-solid fa-circle-check"></i>';
    return `<div class="status-box ${cls}">${icon} ${escapeHtml(text)}</div>`;
  }

  /* ============================================================
   * Master render
   * ============================================================ */
  function renderAll() {
    const hasImages = state.images.length > 0;
    queueSection.classList.toggle('hidden', !hasImages);
    settingsSection.classList.toggle('hidden', !hasImages);
    generateSection.classList.toggle('hidden', !hasImages);
    emptyStateHint.classList.toggle('hidden', hasImages);
    if (!hasImages) generateStatus.innerHTML = '';

    renderQueue();
    renderPreview();
  }

  /* ============================================================
   * Init
   * ============================================================ */
  initTheme();
  renderAll();

  window.addEventListener('beforeunload', () => {
    state.images.forEach((i) => URL.revokeObjectURL(i.url));
  });
})();
