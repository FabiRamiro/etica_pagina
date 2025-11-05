#!/usr/bin/env node
// scripts/generate_images_json.js
// Escanea las carpetas dentro de assets-taller y regenera assets-taller/images.json

const fs = require("fs").promises;
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ASSETS_DIR = path.join(ROOT, "assets-taller");
const OUT_FILE = path.join(ASSETS_DIR, "images.json");

const ALLOWED = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await walk(full);
      files.push(...nested);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (ALLOWED.has(ext)) {
        // store relative path from project root using forward slashes
        const rel = path.relative(ROOT, full).split(path.sep).join("/");
        files.push(rel);
      }
    }
  }
  return files;
}

async function main() {
  try {
    // Ensure assets dir exists
    await fs.access(ASSETS_DIR);
  } catch (e) {
    console.error("No se encontró la carpeta assets-taller en el proyecto.");
    process.exit(1);
  }

  const files = await walk(ASSETS_DIR);
  files.sort();
  await fs.writeFile(OUT_FILE, JSON.stringify(files, null, 2), "utf8");
  console.log(`Regenerado ${OUT_FILE} con ${files.length} imágenes.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
