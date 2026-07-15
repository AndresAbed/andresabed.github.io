import { createRequire } from "node:module";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
let sharp;

try {
  sharp = require("sharp");
} catch {
  throw new Error("Este script requiere sharp. Instalalo temporalmente o ejecutalo desde el runtime de desarrollo que lo incluye.");
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const plansDirectory = path.join(projectRoot, "assets/img/plans");
const adjudicationsDirectory = path.join(projectRoot, "assets/img/adjudicados");
const entries = await readdir(plansDirectory, { withFileTypes: true });
const sources = [path.join(plansDirectory, "plan-dinero-billetes.webp")];

for (const entry of entries) {
  if (entry.isDirectory()) sources.push(path.join(plansDirectory, entry.name, "front-left.webp"));
}

const widths = [480, 800, 1200];
let generated = 0;

await Promise.all(
  sources.flatMap((source) =>
    widths.map(async (width) => {
      const output = source.replace(/\.webp$/i, `-${width}.webp`);
      await sharp(source)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 74, effort: 5, smartSubsample: true })
        .toFile(output);
      generated += 1;
    }),
  ),
);

const adjudicationSources = (await readdir(adjudicationsDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && /^\d+\.webp$/i.test(entry.name))
  .map((entry) => path.join(adjudicationsDirectory, entry.name));

await Promise.all(
  adjudicationSources.map(async (source) => {
    const output = source.replace(/\.webp$/i, "-480.webp");
    await sharp(source)
      .resize({ width: 480, withoutEnlargement: true })
      .webp({ quality: 72, effort: 5, smartSubsample: true })
      .toFile(output);
    generated += 1;
  }),
);

console.log(`Generated ${generated} responsive catalog and adjudication images.`);
