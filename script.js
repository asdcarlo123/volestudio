// ====== CONFIG ======
const ASSETS_ROOT = "./assets/projects";      // raíz de proyectos (carpetas)
const API_ENDPOINT = "/api/projects";         // si tienes backend (Express/Netlify/CF Worker)
const FOLDERS_FALLBACK = [                    // por si no hay API ni manifest
  "RU-SM","B-SJL","CASA-XD","LM-H-1","Antena","VIS"
];

// ====== ELEMENTOS BASE ======
const images = document.querySelectorAll(".center-image");
const menuBtn = document.querySelector(".menu-btn");
const menuContainer = document.querySelector(".menu-container");
const menu = document.getElementById("menu");
const imageContainer = document.querySelector(".image-container");

// ====== MAPA (qué imagen mostrar por sección) ======
const slideToImage = { "inicio":0, "proyectos":1, "tecnologia":2, "contacto":0, "nosotros":1 };

// ====== ROTACIÓN AUTOMÁTICA DE PORTADA ======
let autoIndex = 0;
let autoInterval = setInterval(autoRotate, 5000);
function autoRotate() {
  const inicio = document.getElementById("inicio-content");
  if (inicio && inicio.classList.contains("active")) {
    images[autoIndex]?.classList.remove("active");
    autoIndex = (autoIndex + 1) % images.length;
    images[autoIndex]?.classList.add("active");
  }
}

// ====== PARALLAX SUAVE ======
document.addEventListener("mousemove", (e) => {
  const activeImage = document.querySelector(".center-image.active");
  if (!activeImage) return;
  const moveX = (0.5 - e.clientX / window.innerWidth) * 50;
  const moveY = (0.5 - e.clientY / window.innerHeight) * 50;
  activeImage.style.transform = `translate(${moveX}px, ${moveY}px)`;
}, { passive: true });

// ====== HELPERS ======
const fmtM2 = (n) => {
  try { return `${parseInt(n, 10).toLocaleString("es-PE")} m²`; }
  catch { return `${n} m²`; }
};
const get = async (url) => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
};

// ====== CARGA DE PROYECTOS (API -> manifest -> fallback) ======
let PROJECTS = [];
let projectsLoaded = false;

async function loadFromAPI() {
  // Estructura esperada:
  // { projects: [{ folder,title,area,blurb,text,images: ["assets/projects/FOLDER/archivo.jpg", ...] }]}
  const data = await get(API_ENDPOINT);
  if (!Array.isArray(data.projects)) throw new Error("API sin 'projects'");
  return data.projects;
}

async function loadFromManifest() {
  const data = await get(`${ASSETS_ROOT}/manifest.json?${Date.now()}`);
  if (!Array.isArray(data.projects)) throw new Error("Manifest sin 'projects'");
  return data.projects.map(p => ({
    folder: p.folder,
    title: p.title || p.folder,
    area: typeof p.area !== "undefined" ? p.area : null,
    blurb: p.blurb || "",
    text: p.text || "",
    images: Array.isArray(p.images) ? p.images : []
  }));
}

async function tryReadJSON(url) {
  try { return await get(url); } catch { return null; }
}

async function loadFromFallback() {
  // Lee metadata/index por carpeta si existen; si no, usa cover + numeradas
  const projects = [];
  for (const folder of FOLDERS_FALLBACK) {
    const meta = await tryReadJSON(`${ASSETS_ROOT}/${folder}/metadata.json`);
    const idx = await tryReadJSON(`${ASSETS_ROOT}/${folder}/index.json`);
    const title = meta?.title || folder.replace(/[-_]+/g, " ").replace(/\b[a-z]/g, m => m.toUpperCase());
    const area = typeof meta?.area !== "undefined" ? meta.area : null;
    const blurb = meta?.blurb || "";
    const text  = meta?.text  || "";
    let images = Array.isArray(idx) ? idx.map(name => `${ASSETS_ROOT}/${folder}/${name}`) : [];
    // Siempre intenta incluir cover primero
    images = [
      `${ASSETS_ROOT}/${folder}/cover.jpg`,
      ...images.filter(p => !/\/cover\./i.test(p))
    ];
    // Si no hay index.json, agrega 01..12 como candidatos
    if (!idx) {
      for (let i = 1; i <= 12; i++) {
        const nn = String(i).padStart(2, "0");
        images.push(`${ASSETS_ROOT}/${folder}/${nn}.jpg`);
      }
    }
    projects.push({ folder, title, area, blurb, text, images });
  }
  return projects;
}

async function loadProjects() {
  if (projectsLoaded) return PROJECTS;
  try {
    PROJECTS = await loadFromAPI();
  } catch (_) {
    try {
      PROJECTS = await loadFromManifest();
    } catch (_) {
      PROJECTS = await loadFromFallback();
    }
  }
  projectsLoaded = true;
  return PROJECTS;
}

// ====== UTILERÍA DOM GALERÍA ======
function ensureGalleryDom() {
  let galeria = document.getElementById("galeria-proyectos");
  if (!galeria) {
    galeria = document.createElement("div");
    galeria.id = "galeria-proyectos";
    galeria.className = "gallery-wrapper";
    galeria.style.display = "none";
    document.body.appendChild(galeria);
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
    // prioriza cover.* si existe
    const cover = p.images.find(x => /\/cover\./i.test(x)) || p.images[0];
    return cover;
  }
  // fallback básico
  return `${ASSETS_ROOT}/${p.folder}/cover.jpg`;
}

function getAllPics(p) {
  if (Array.isArray(p.images) && p.images.length) return p.images;
  const out = [`${ASSETS_ROOT}/${p.folder}/cover.jpg`];
  for (let i=1; i<=12; i++) out.push(`${ASSETS_ROOT}/${p.folder}/${String(i).padStart(2,"0")}.jpg`);
  return out;
}

// ====== PINTAR GALERÍA ======
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
    img.onerror = () => { card.remove(); }; // si el cover no existe, oculta tarjeta

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
    card.addEventListener("click", () => openProjectDetail(idx), { passive: true });

    grid.appendChild(card);
  });
}

// ====== OVERLAY DETALLE ======
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
            <img id="detail-image" alt="">
            <div id="detail-thumbs" class="detail-thumbs"></div>
          </div>
          <div class="detail-info">
            <h3 id="detail-title">Proyecto</h3>
            <p id="detail-meta" class="detail-meta"></p>
            <p id="detail-text" class="detail-text"></p>
          </div>
        </div>
      </aside>
    `;
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

const {
  overlay,
  backdrop,
  closeBtn,
  titleEl,
  metaEl,
  textEl,
  imgEl,
  thumbsEl
} = ensureOverlayDom();

let currentProject = -1;
let currentImageIdx = 0;
let currentPics = [];

function setDetailImage(src) {
  imgEl.onerror = () => {
    // si falla, intenta la siguiente imagen disponible
    if (!currentPics.length) { imgEl.removeAttribute("src"); return; }
    const next = (currentImageIdx + 1) % currentPics.length;
    if (next === currentImageIdx) { imgEl.removeAttribute("src"); return; }
    currentImageIdx = next;
    imgEl.onerror = null;
    setDetailImage(currentPics[currentImageIdx]);
  };
  imgEl.src = src;
  imgEl.alt = titleEl.textContent || "Imagen de proyecto";
}

function renderThumbs(pics){
  thumbsEl.innerHTML = "";
  pics.forEach((s, i) => {
    const th = document.createElement("div");
    th.className = "detail-thumb" + (i===0 ? " active":"");
    const im = document.createElement("img");
    im.src = s; im.alt = `Vista ${i+1}`;
    im.onerror = () => th.remove(); // thumb oculto si no existe
    th.appendChild(im);
    th.addEventListener("click", () => {
      if (i === currentImageIdx) return;
      currentImageIdx = i;
      setDetailImage(pics[i]);
      [...thumbsEl.children].forEach(c => c.classList.remove("active"));
      th.classList.add("active");
    }, { passive: true });
    thumbsEl.appendChild(th);
  });
}

function openProjectDetail(idx){
  const p = PROJECTS[idx]; if(!p) return;
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

// ====== NAVEGACIÓN DEL MENÚ ======
document.querySelectorAll(".menu a").forEach(link => {
  link.addEventListener("click", async function(e){
    e.preventDefault();
    clearInterval(autoInterval);

    const slideId = this.getAttribute("data-slide");

    const inicio = document.getElementById("inicio-content");
    if (inicio) inicio.classList.toggle("active", slideId === "inicio");

    document.querySelectorAll(".slide-container").forEach(s => s.classList.remove("active"));
    if (slideId !== "inicio") document.getElementById("slide-" + slideId)?.classList.add("active");

    const { galeria } = ensureGalleryDom();
    if (slideId === "proyectos") {
      await loadProjects();     // aseguramos datos
      renderGallery();          // pintamos
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

    images.forEach((img, idx) => {
      img.classList.remove("active");
      img.style.transform = "translate(0, 0)";
      if (idx === slideToImage[slideId]) img.classList.add("active");
    });

    menu?.classList.remove("show");
  }, { passive:true });
});

// Hover y toggle del menú
if (menuContainer && menu) {
  menuContainer.addEventListener("mouseenter", () => menu.classList.add("show"), { passive:true });
  menuContainer.addEventListener("mouseleave", () => menu.classList.remove("show"), { passive:true });
}
if (menuBtn && menu) {
  menuBtn.addEventListener("click", () => menu.classList.toggle("show"));
}
