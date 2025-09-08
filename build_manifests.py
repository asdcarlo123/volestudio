#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
build_manifests.py
Genera:
  - assets/Homepage/manifest.json
  - assets/projects/*/index.json
  - assets/projects/*/metadata.json (si no existe o con --force)
  - assets/projects/manifest.json
Uso:
  py -3 build_manifests.py --webroot "C:\\Users\\Carlo\\OneDrive\\VOL-TEC E.I.R.L\\vol_tec_web"
  # o estando en la raíz:
  py -3 build_manifests.py --webroot .
Opciones:
  --force     Reescribe metadata.json existentes con plantilla base
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

IMG_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}

def info(msg: str):
    print(f"[i] {msg}")

def warn(msg: str):
    print(f"[!] {msg}", file=sys.stderr)

def webpath(p: Path) -> str:
    # Cambia '\' por '/' para URLs
    return str(p).replace("\\", "/")

def natural_key(name: str):
    # Orden "natural": números como números
    # "10.jpg" irá después de "2.jpg"
    toks = re.split(r"(\d+)", name)
    key = []
    for t in toks:
        if t.isdigit():
            key.append(int(t))
        else:
            key.append(t.lower())
    return tuple(key)

def list_images(folder: Path):
    if not folder.exists():
        return []
    files = [f for f in folder.iterdir() if f.is_file() and f.suffix.lower() in IMG_EXTS]
    files.sort(key=lambda p: (natural_key(p.stem), p.name.lower()))
    return files

def to_title_from_folder(name: str) -> str:
    name = re.sub(r"[-_]+", " ", name).strip()
    return name.title()

def write_json(path: Path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)

def read_json(path: Path):
    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None

def build_homepage_manifest(home_dir: Path):
    if not home_dir.exists():
        warn(f"No existe Homepage dir: {home_dir}")
        return
    imgs = list_images(home_dir)
    names = [p.name for p in imgs]
    manifest = {"images": names}
    out = home_dir / "manifest.json"
    write_json(out, manifest)
    info(f"Homepage manifest -> {webpath(out)} (imagenes: {len(names)})")

def build_projects_manifests(projects_dir: Path, force: bool):
    if not projects_dir.exists():
        warn(f"No existe projects dir: {projects_dir}")
        return

    projects = []
    for folder in sorted([d for d in projects_dir.iterdir() if d.is_dir()], key=lambda p: p.name.lower()):
        info(f"Proyecto: {folder.name}")
        imgs = list_images(folder)
        if not imgs:
            warn(f"  (sin imágenes) -> {folder.name}")
            continue

        # cover: cover.* si existe, si no la primera
        cover = next((f for f in imgs if f.stem.lower() == "cover"), None) or imgs[0]

        # index.json = nombres (sin cover)
        index_names = [f.name for f in imgs if f != cover]
        index_path = folder / "index.json"
        write_json(index_path, index_names)
        info(f"  index.json -> {webpath(index_path)} (fotos: {len(index_names)})")

        # metadata.json
        meta_path = folder / "metadata.json"
        meta = read_json(meta_path)
        if meta is None or force:
            title = to_title_from_folder(folder.name)
            meta = {
                "title": title,
                "area": None,
                "blurb": "",
                "text": ""
            }
            write_json(meta_path, meta)
            info(f"  metadata.json -> {webpath(meta_path)} (creado{'/forzado' if force else ''})")
        else:
            info("  metadata.json -> existente (no tocado)")

        # manifest global: cover + resto con rutas web
        rel_root = Path("assets") / "projects" / folder.name
        cover_rel = webpath(rel_root / cover.name)
        images_rel = [cover_rel] + [webpath(rel_root / n) for n in index_names]

        projects.append({
            "folder": folder.name,
            "title": meta.get("title") or to_title_from_folder(folder.name),
            "area": meta.get("area"),
            "blurb": meta.get("blurb", ""),
            "text": meta.get("text", ""),
            "images": images_rel
        })

    # manifest.json global
    manifest_path = projects_dir / "manifest.json"
    write_json(manifest_path, {"projects": projects})
    info(f"Projects manifest -> {webpath(manifest_path)} (proyectos: {len(projects)})")

def main():
    parser = argparse.ArgumentParser(description="Genera manifests y metadata para Homepage y Projects.")
    parser.add_argument("--webroot", type=str, default=".", help="Ruta raíz del proyecto (contiene /assets)")
    parser.add_argument("--force", action="store_true", help="Reescribe metadata.json existentes")
    args = parser.parse_args()

    webroot = Path(args.webroot).resolve()
    assets_dir = webroot / "assets"
    home_dir   = assets_dir / "Homepage"
    proj_dir   = assets_dir / "projects"

    if not assets_dir.exists():
        print(f"ERROR: No encuentro {assets_dir}", file=sys.stderr)
        sys.exit(1)

    build_homepage_manifest(home_dir)
    build_projects_manifests(proj_dir, args.force)
    print("\nListo. Revisa los manifests/metadata generados 👌")

if __name__ == "__main__":
    main()
