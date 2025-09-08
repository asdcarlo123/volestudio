// scripts/generate-manifest.mjs
import { promises as fs } from "fs";
import path from "path";

const argRoot   = process.argv[2] || "assets/projects"; // ruta al folder real
const webPrefix = process.argv[3] || "assets/projects"; // prefijo URL en la web

const ROOT = path.resolve(argRoot);
const OUT  = path.join(ROOT, "manifest.json");
const IMG_EXT = new Set([".jpg",".jpeg",".png",".webp",".avif"]);

const toTitle = (s) =>
  s.replace(/[-_]+/g, " ")
   .replace(/\s+/g, " ")
   .trim()
   .replace(/\b([a-z])/g, (_, c) => c.toUpperCase());

const sortByImageOrder = (a, b) => {
  const ac = /^cover\./i.test(a), bc = /^cover\./i.test(b);
  if (ac && !bc) return -1;
  if (!ac && bc) return 1;
  const an = a.match(/(\d+)/), bn = b.match(/(\d+)/);
  if (an && bn) return parseInt(an[1]) - parseInt(bn[1]);
  return a.localeCompare(b);
};

async function readJSONIfExists(file) {
  try { return JSON.parse(await fs.readFile(file, "utf8")); }
  catch { return null; }
}

async function readFolder(folder) {
  const abs = path.join(ROOT, folder);
  const ents = await fs.readdir(abs, { withFileTypes: true });

  const meta = await readJSONIfExists(path.join(abs, "metadata.json")) || {};
  const files = ents
    .filter(e => e.isFile())
    .map(e => e.name)
    .filter(n => IMG_EXT.has(path.extname(n).toLowerCase()))
    .sort(sortByImageOrder);

  // Si no hay cover, hacemos el primero como "cover" al frente.
  if (!files.some(f => /^cover\./i.test(f)) && files.length) {
    const first = files.splice(0,1)[0];
    files.unshift(first);
  }

  const images = files.map(f => `${webPrefix}/${folder}/${f}`.replaceAll("\\","/"));

  return {
    folder,
    title: meta.title || toTitle(folder),
    area:  typeof meta.area === "number" ? meta.area : null,
    blurb: meta.blurb || "",
    text:  meta.text  || "",
    images
  };
}

async function main() {
  const entries = await fs.readdir(ROOT, { withFileTypes: true });
  const folders = entries.filter(e => e.isDirectory()).map(e => e.name);

  const projects = [];
  for (const folder of folders) {
    projects.push(await readFolder(folder));
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    root: webPrefix,
    projects
  };

  await fs.writeFile(OUT, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`✅ Manifest creado en: ${OUT}`);
}

main().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
