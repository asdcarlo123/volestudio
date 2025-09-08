// =====================================================
// ================   CONFIGURACIÓN   ==================
// =====================================================
const ASSETS_ROOT      = "./assets/projects";
const API_ENDPOINT     = "/api/projects";
const FOLDERS_FALLBACK = ["RU-SM","B-SJL","CASA-XD","LM-H-1","Antena","VIS"];

// Homepage (portada)
const HOMEPAGE_ROOT     = "./assets/Homepage";
const HOMEPAGE_MANIFEST = `${HOMEPAGE_ROOT}/manifest.json`;

const bust = () => `?v=${Date.now()}`;


// =====================================================
// ================   ELEMENTOS BASE   =================
// =====================================================
let images = []; // portada; se llena dinámicamente
const menuBtn        = document.querySelector(".menu-btn");
const menuContainer  = document.querySelector(".menu-container");
const menu           = document.getElementById("menu");
const imageContainer = document.querySelector(".image-container");

const slideToImage = { "inicio":0, "proyectos":1, "tecnologia":2, "contacto":0, "nosotros":1 };


// =====================================================
// ========  ROTACIÓN AUTOMÁTICA (PORTADA)  ============
// =====================================================
let autoIndex = 0;
let autoInterval = setInterval(autoRotate, 2000);

function autoRotate() {
  const inicio = document.getElementById("inicio-content");
  if (!(inicio && inicio.classList.contains("active"))) return;
  if (!images.length) return;
  images[autoIndex]?.classList.remove("active");
  autoIndex = (autoIndex + 1) % images.length;
  images[autoIndex]?.classList.add("active");
}


// =====================================================
// ================   PARALLAX SUAVE   =================
// =====================================================
document.addEventListener("mousemove", (e) => {
  const activeImage = document.querySelector(".center-image.active");
  if (!activeImage) return;
  const moveX = (0.5 - e.clientX / window.innerWidth) * 50;
  const moveY = (0.5 - e.clientY / window.innerHeight) * 50;
  activeImage.style.setProperty('--tx', `${moveX}px`);
  activeImage.style.setProperty('--ty', `${moveY}px`);
}, { passive: true });

function resetParallax() {
  document.querySelectorAll(".center-image").forEach(img => {
    img.style.setProperty('--tx', '0px');
    img.style.setProperty('--ty', '0px');
  });
}


// =====================================================
// ===================== HELPERS =======================
// =====================================================
const fmtM2 = (n) => { try { return `${parseInt(n, 10).toLocaleString("es-PE")} m²`; } catch { return `${n} m²`; } };

async function fetchJSON(url) {
  const res = await fetch(url + (url.includes("?") ? "" : bust()), { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
  return res.json();
}
async function tryReadJSON(url) { try { return await fetchJSON(url); } catch { return null; } }

function filenameToTitle(name) {
  return (name || "").replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}


// =====================================================
// ====== CARGA DE HOMEPAGE (manifest.json) ============
// =====================================================
async function loadHomepageImages(){
  if (!imageContainer) return;

  let list = null;
  const data = await tryReadJSON(HOMEPAGE_MANIFEST);
  if (Array.isArray(data)) list = data;
  else if (data && Array.isArray(data.images)) list = data.images;

  if (Array.isArray(list) && list.length) {
    imageContainer.innerHTML = "";
    list.forEach((name, idx) => {
      const src = `${HOMEPAGE_ROOT}/${name}`;
      const img = document.createElement("img");
      img.src = src;
      img.alt = filenameToTitle(name) || `Imagen ${idx+1}`;
      img.className = "center-image" + (idx === 0 ? " active" : "");
      img.loading = idx === 0 ? "eager" : "lazy";
      img.decoding = "async";
      imageContainer.appendChild(img);
    });
  }

  images = Array.from(document.querySelectorAll(".center-image"));
  autoIndex = 0;
  images.slice(1).forEach(i => { const pre = new Image(); pre.src = i.src; });
}


// =====================================================
// ====== CARGA DE PROYECTOS (API -> manifest -> fallback)
// =====================================================
let PROJECTS = [];
let projectsLoaded = false;

async function loadFromAPI() {
  const data = await fetchJSON(API_ENDPOINT);
  if (!Array.isArray(data.projects)) throw new Error("API sin 'projects'");
  return data.projects;
}
async function loadFromManifest() {
  const data = await fetchJSON(`${ASSETS_ROOT}/manifest.json`);
  if (!Array.isArray(data.projects)) throw new Error("Manifest sin 'projects'");
  return data.projects.map(p => ({
    folder: p.folder,
    title : p.title || p.folder,
    area  : typeof p.area !== "undefined" ? p.area : null,
    blurb : p.blurb || "",
    text  : p.text  || "",
    images: Array.isArray(p.images) ? p.images : []
  }));
}
async function loadFromFallback() {
  const projects = [];
  for (const folder of FOLDERS_FALLBACK) {
    const meta = await tryReadJSON(`${ASSETS_ROOT}/${folder}/metadata.json`);
    const idx  = await tryReadJSON(`${ASSETS_ROOT}/${folder}/index.json`);
    const title = meta?.title || folder.replace(/[-_]+/g, " ").replace(/\b[a-z]/g, m => m.toUpperCase());
    const area  = typeof meta?.area !== "undefined" ? meta.area : null;
    const blurb = meta?.blurb || "";
    const text  = meta?.text  || "";

    let images = Array.isArray(idx) ? idx.map(name => `${ASSETS_ROOT}/${folder}/${name}`) : [];
    const cover = `${ASSETS_ROOT}/${folder}/cover.jpg`;
    images = [cover, ...images.filter(p => !/\/cover\./i.test(p))];

    if (!idx) for (let i = 1; i <= 12; i++) images.push(`${ASSETS_ROOT}/${folder}/${String(i).padStart(2,"0")}.jpg`);

    projects.push({ folder, title, area, blurb, text, images });
  }
  return projects;
}
async function loadProjects() {
  if (projectsLoaded) return PROJECTS;
  try { PROJECTS = await loadFromAPI(); }
  catch { try { PROJECTS = await loadFromManifest(); } catch { PROJECTS = await loadFromFallback(); } }
  projectsLoaded = true; return PROJECTS;
}


// =====================================================
// ===============  METADATA POR CARPETA  ==============
// =====================================================
async function ensureProjectMeta(idx) {
  const p = PROJECTS[idx];
  if (!p || p._metaLoaded !== undefined) return p;
  if (!p.folder) { p._metaLoaded = false; return p; }
  try {
    const metaUrl = `${ASSETS_ROOT}/${encodeURIComponent(p.folder)}/metadata.json`;
    const meta = await fetchJSON(metaUrl);
    if (meta && typeof meta === "object") {
      if (meta.title) p.title = meta.title;
      if (meta.area  !== undefined) p.area  = meta.area;
      if (meta.blurb) p.blurb = meta.blurb;
      if (meta.text)  p.text  = meta.text;
    }
    p._metaLoaded = true;
  } catch { p._metaLoaded = false; }
  return p;
}


// =====================================================
// ==================  GALERÍA DOM  ====================
// =====================================================
function ensureGalleryDom() {
  let galeria = document.getElementById("galeria-proyectos");
  if (!galeria) {
    galeria = document.createElement("div");
    galeria.id = "galeria-proyectos";
    galeria.className = "gallery-wrapper";
    galeria.style.display = "none";
    document.body.appendChild(galeria);
  }
  // CTA sticky: volver
  let cta = galeria.querySelector(".gallery-cta");
  if (!cta){
    cta = document.createElement("div");
    cta.className = "gallery-cta";
    cta.innerHTML = `<button class="gallery-back" type="button">← VOLVER AL INICIO</button>`;
    galeria.appendChild(cta);
    cta.querySelector(".gallery-back").addEventListener("click", () => navigateTo("inicio"));
  }
  let grid = document.getElementById("gallery-grid");
  if (!grid) {
    grid = document.createElement("div");
    grid.id = "gallery-grid";
    grid.className = "gallery-grid";
    galeria.appendChild(grid);
  }
  return { galeria, grid };
}

function getCoverSrc(p) {
  if (Array.isArray(p.images) && p.images.length) {
    return p.images.find(x => /\/cover\./i.test(x)) || p.images[0];
  }
  return `${ASSETS_ROOT}/${p.folder}/cover.jpg`;
}
function getAllPics(p) {
  if (Array.isArray(p.images) && p.images.length) return p.images;
  const out = [`${ASSETS_ROOT}/${p.folder}/cover.jpg`];
  for (let i=1; i<=12; i++) out.push(`${ASSETS_ROOT}/${p.folder}/${String(i).padStart(2,"0")}.jpg`);
  return out;
}

async function renderGallery() {
  await loadProjects();
  const { grid } = ensureGalleryDom();
  grid.innerHTML = "";

  if (!PROJECTS.length) {
    const empty = document.createElement("p");
    empty.textContent = "Sin proyectos disponibles.";
    empty.style.padding = "20px";
    grid.appendChild(empty);
    return;
  }

  PROJECTS.forEach((p, idx) => {
    const card = document.createElement("figure");
    card.className = "gallery-item";

    const img = document.createElement("img");
    img.src = getCoverSrc(p);
    img.alt = p.title || "Proyecto";
    img.loading = "lazy";
    img.decoding = "async";
    img.onerror = () => { card.remove(); };

    const cap = document.createElement("figcaption");
    cap.className = "gallery-caption";

    const h3 = document.createElement("h3");
    h3.className = "gallery-title";
    h3.textContent = p.title || "Proyecto";

    const meta = document.createElement("p");
    meta.className = "gallery-meta";
    meta.textContent = [
      (typeof p.area !== "undefined" && p.area !== null ? fmtM2(p.area) : null),
      (p.blurb || null)
    ].filter(Boolean).join(" • ");

    cap.appendChild(h3);
    if (meta.textContent.trim() !== "") cap.appendChild(meta);

    card.appendChild(img);
    card.appendChild(cap);
    card.addEventListener("click", () => openProjectDetail(idx));

    grid.appendChild(card);
  });
}


// =====================================================
// =================  OVERLAY DETALLE  =================
// =====================================================
function ensureOverlayDom() {
  let overlay = document.getElementById("project-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "project-overlay";
    overlay.className = "detail-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
  <div class="detail-backdrop" data-close="1"></div>
  <aside class="detail-panel" role="dialog" aria-modal="true" aria-labelledby="detail-title">
    <button class="detail-close" aria-label="Cerrar" data-close="1">×</button>
    <div class="detail-body">
      <div class="detail-media">
        <div class="detail-canvas">
          <img id="detail-image" alt="">
        </div>
        <div id="detail-thumbs" class="detail-thumbs"></div>
      </div>
      <div class="detail-info">
        <h3 id="detail-title">Proyecto</h3>
        <p id="detail-meta" class="detail-meta"></p>
        <p id="detail-text" class="detail-text"></p>
      </div>
    </div>
  </aside>`;
    document.body.appendChild(overlay);
  }
  return {
    overlay,
    backdrop: overlay.querySelector(".detail-backdrop"),
    closeBtn: overlay.querySelector(".detail-close"),
    titleEl: overlay.querySelector("#detail-title"),
    metaEl: overlay.querySelector("#detail-meta"),
    textEl: overlay.querySelector("#detail-text"),
    imgEl: overlay.querySelector("#detail-image"),
    thumbsEl: overlay.querySelector("#detail-thumbs"),
  };
}
const { overlay, backdrop, closeBtn, titleEl, metaEl, textEl, imgEl, thumbsEl } = ensureOverlayDom();

let currentProject = -1;
let currentImageIdx = 0;
let currentPics = [];

/* ====== Canvas cuadrado y autosize ====== */
function ensureCanvasWrapper() {
  const panel = document.querySelector(".detail-panel");
  if (!panel) return null;
  const body  = panel.querySelector(".detail-body");
  const media = panel.querySelector(".detail-media");
  const img   = panel.querySelector("#detail-image");
  let canvas  = panel.querySelector(".detail-canvas");
  if (!canvas && img) {
    canvas = document.createElement("div");
    canvas.className = "detail-canvas";
    img.parentNode.insertBefore(canvas, img);
    canvas.appendChild(img);
  }
  return { panel, body, media, canvas, img };
}
function sizeDetailCanvas() {
  const refs = ensureCanvasWrapper();
  if (!refs) return;
  const { body, media, canvas } = refs;
  const bodyRect  = body.getBoundingClientRect();
  const mediaRect = media.getBoundingClientRect();
  const thumbs    = media.querySelector(".detail-thumbs");
  const gap = 12;
  const thumbsH = thumbs ? thumbs.getBoundingClientRect().height : 0;
  const maxH = Math.max(200, bodyRect.height - thumbsH - gap);
  const maxW = mediaRect.width;
  const side = Math.max(160, Math.min(maxW, maxH));
  canvas.style.height = side + "px";
}
function bindResizeObserver() {
  const refs = ensureCanvasWrapper();
  if (!refs) return;
  const { panel, body } = refs;
  let rafId = null;
  function onResize(){ cancelAnimationFrame(rafId); rafId = requestAnimationFrame(sizeDetailCanvas); }
  window.addEventListener("resize", onResize);
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => sizeDetailCanvas());
    ro.observe(body);
    panel._detailRO = ro;
  }
  setTimeout(sizeDetailCanvas, 50);
  setTimeout(sizeDetailCanvas, 200);
  setTimeout(sizeDetailCanvas, 600);
  window.addEventListener("orientationchange", () => setTimeout(sizeDetailCanvas, 250));
}

/* ====== Carrete: drag + wheel + pick ====== */
function enableThumbsDragScroll(el, onPick){
  if (!el) return;
  let isDown=false, startX=0, startLeft=0, moved=false, pid=null;
  el.addEventListener("pointerdown", (e) => {
    isDown = true; moved = false;
    pid = e.pointerId; el.setPointerCapture(pid);
    startX = e.clientX; startLeft = el.scrollLeft;
    el.classList.add("dragging");
  });
  el.addEventListener("pointermove", (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX; if (Math.abs(dx) > 3) moved = true;
    el.scrollLeft = startLeft - dx;
  });
  function finish(e){
    if (!isDown) return;
    if (!moved) {
      const th = e.target.closest(".detail-thumb");
      if (th && el.contains(th)) {
        const i = [...el.children].indexOf(th);
        if (i > -1) onPick?.(i);
      }
    }
    isDown=false; moved=false;
    if (pid != null) { try { el.releasePointerCapture(pid); } catch {} pid=null; }
    el.classList.remove("dragging");
  }
  el.addEventListener("pointerup", finish);
  el.addEventListener("pointercancel", finish);
  el.addEventListener("pointerleave", finish);
  el.addEventListener("click", (e) => {
    const th = e.target.closest(".detail-thumb"); if (!th) return;
    const i = [...el.children].indexOf(th); if (i > -1) onPick?.(i);
  });
  el.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { el.scrollLeft += e.deltaY; e.preventDefault(); }
  }, { passive: false });
}

/* ====== Imagen principal y thumbs ====== */
function setDetailImage(src) {
  const { img } = ensureCanvasWrapper() || {};
  if (!img) return;
  img.onerror = () => {
    if (!currentPics.length) { img.removeAttribute("src"); return; }
    const next = (currentImageIdx + 1) % currentPics.length;
    if (next === currentImageIdx) { img.removeAttribute("src"); return; }
    currentImageIdx = next; img.onerror = null; setDetailImage(currentPics[currentImageIdx]);
  };
  img.onload = () => sizeDetailCanvas();
  img.src = src;
  img.alt = (titleEl?.textContent || "Imagen de proyecto");
}
function renderThumbs(pics){
  thumbsEl.innerHTML = "";
  pics.forEach((s, i) => {
    const th = document.createElement("div");
    th.className = "detail-thumb" + (i===0 ? " active":"");
    const im = document.createElement("img"); im.src = s; im.alt = `Vista ${i+1}`;
    im.onerror = () => th.remove();
    th.appendChild(im);
    thumbsEl.appendChild(th);
  });
  enableThumbsDragScroll(thumbsEl, (i) => {
    if (i === currentImageIdx) return;
    currentImageIdx = i;
    setDetailImage(currentPics[i]);
    [...thumbsEl.children].forEach((c, idx) => c.classList.toggle("active", idx === i));
  });
  sizeDetailCanvas();
}

/* ====== Abrir / Cerrar panel ====== */
async function openProjectDetail(idx){
  await loadProjects();
  let p = PROJECTS[idx]; if(!p) return;
  p = await ensureProjectMeta(idx) || p;

  currentProject = idx; currentImageIdx = 0;

  titleEl.textContent = p.title || "Proyecto";
  metaEl.textContent = [
    (typeof p.area !== "undefined" && p.area !== null ? fmtM2(p.area) : null),
    (p.blurb || null)
  ].filter(Boolean).join(" • ");
  textEl.textContent = p.text || "";

  currentPics = getAllPics(p);
  if (!currentPics.length) return;

  setDetailImage(currentPics[0]);
  renderThumbs(currentPics);
  bindResizeObserver();

  overlay.setAttribute("aria-hidden", "false");
  overlay.classList.add("open");
  document.body.classList.add("modal-open");
}
function closeOverlay(){
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden","true");
  currentProject = -1;
  currentPics = [];
  document.body.classList.remove("modal-open");
}
const { backdrop: _bd, closeBtn: _cb } = { backdrop, closeBtn };
backdrop.addEventListener("click", closeOverlay, { passive:true });
closeBtn.addEventListener("click", closeOverlay);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && overlay.classList.contains("open")) closeOverlay();
  if (overlay.classList.contains("open") && (e.key==="ArrowRight" || e.key==="ArrowLeft")){
    if (!currentPics.length) return;
    if (e.key==="ArrowRight") currentImageIdx = (currentImageIdx+1) % currentPics.length;
    if (e.key==="ArrowLeft")  currentImageIdx = (currentImageIdx-1+currentPics.length) % currentPics.length;
    setDetailImage(currentPics[currentImageIdx]);
    [...thumbsEl.children].forEach((c,i) => c.classList.toggle("active", i===currentImageIdx));
  }
});


// =====================================================
// ==================  NAVEGACIÓN  =====================
// =====================================================
async function navigateTo(slideId){
  clearInterval(autoInterval);
  resetParallax();

  const inicio = document.getElementById("inicio-content");
  if (inicio) inicio.classList.toggle("active", slideId === "inicio");

  document.querySelectorAll(".slide-container").forEach(s => s.classList.remove("active"));
  if (slideId !== "inicio") document.getElementById("slide-" + slideId)?.classList.add("active");

  const { galeria } = ensureGalleryDom();
  if (slideId === "proyectos") {
    await loadProjects();
    renderGallery();
    galeria.style.display = "flex";
    galeria.classList.add("active");
    document.body.classList.add("proyectos-active");
    if (imageContainer) { imageContainer.style.display="none"; imageContainer.style.zIndex="-1"; }
  } else {
    galeria.style.display = "none";
    galeria.classList.remove("active");
    document.body.classList.remove("proyectos-active");
    if (imageContainer) { imageContainer.style.display="block"; imageContainer.style.zIndex="0"; }
    if (overlay.classList.contains("open")) closeOverlay();
  }

  // Imagen de portada asociada a la sección
  if (images.length){
    images.forEach((img, idx) => { img.classList.remove("active"); if (idx === slideToImage[slideId]) img.classList.add("active"); });
  }

  menu?.classList.remove("show");
}

document.querySelectorAll(".menu a").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const slideId = link.getAttribute("data-slide");
    navigateTo(slideId);
  });
});

// Hover / toggle menú
if (menuContainer && menu) {
  menuContainer.addEventListener("mouseenter", () => menu.classList.add("show"), { passive:true });
  menuContainer.addEventListener("mouseleave", () => menu.classList.remove("show"), { passive:true });
}
if (menuBtn && menu) { menuBtn.addEventListener("click", () => menu.classList.toggle("show")); }


// =====================================================
// ===================== INIT ==========================
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  loadHomepageImages(); // portada desde manifest (o fallback HTML)
});
