import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const plansDirectory = path.join(projectRoot, "assets/img/plans");
const outputPath = path.join(projectRoot, "data/plan-media-index.json");
const entries = await readdir(plansDirectory, { withFileTypes: true });
const folders = {};

for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
  if (!entry.isDirectory()) continue;

  try {
    const metadata = JSON.parse(await readFile(path.join(plansDirectory, entry.name, "metadata.json"), "utf8"));
    folders[entry.name] = metadata;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

await writeFile(outputPath, `${JSON.stringify({ folders }, null, 2)}\n`);
console.log(`Built ${path.relative(projectRoot, outputPath)} from ${Object.keys(folders).length} metadata files.`);
