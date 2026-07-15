import { spawn } from "node:child_process";
import { createReadStream, watch } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildCssScript = path.join(projectRoot, "scripts/build-css.mjs");
const port = Number(process.argv[2] || 8000);
const cssSourceDirectories = ["assets/css/core", "assets/css/components", "assets/css/pages"].map((directory) =>
  path.join(projectRoot, directory),
);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("Usá un puerto válido entre 1 y 65535. Ejemplo: node scripts/dev-server.mjs 8010");
}

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function runCssBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [buildCssScript], {
      cwd: projectRoot,
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`La compilación de CSS terminó con código ${code ?? "desconocido"}.`));
    });
  });
}

let isBuildingCss = false;
let buildQueued = false;
let rebuildTimer;

async function rebuildCss(reason) {
  if (isBuildingCss) {
    buildQueued = true;
    return;
  }

  isBuildingCss = true;

  try {
    await runCssBuild();
    console.log(`[dev] CSS actualizado (${reason}).`);
  } catch (error) {
    console.error("[dev] No se pudo actualizar el CSS.", error);
  } finally {
    isBuildingCss = false;

    if (buildQueued) {
      buildQueued = false;
      void rebuildCss("cambio pendiente");
    }
  }
}

function queueCssRebuild(filename) {
  if (!filename || !filename.endsWith(".css")) return;

  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => {
    void rebuildCss(filename);
  }, 80);
}

function resolveRequestPath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl || "/", "http://localhost").pathname);
  const requestedPath = path.resolve(projectRoot, `.${pathname}`);

  if (requestedPath !== projectRoot && !requestedPath.startsWith(`${projectRoot}${path.sep}`)) return null;
  return requestedPath;
}

async function serveFile(request, response) {
  if (!["GET", "HEAD"].includes(request.method || "GET")) {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Método no permitido");
    return;
  }

  let filePath = resolveRequestPath(request.url);
  if (!filePath) {
    response.writeHead(403);
    response.end("Acceso denegado");
    return;
  }

  try {
    let fileInfo = await stat(filePath);
    if (fileInfo.isDirectory()) {
      filePath = path.join(filePath, "index.html");
      fileInfo = await stat(filePath);
    }

    if (!fileInfo.isFile()) throw new Error("No es un archivo");

    const headers = {
      "Cache-Control": "no-store, max-age=0, must-revalidate",
      "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      Expires: "0",
      Pragma: "no-cache",
    };

    response.writeHead(200, headers);
    if (request.method === "HEAD") {
      response.end();
      return;
    }

    createReadStream(filePath)
      .on("error", () => response.destroy())
      .pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Archivo no encontrado");
  }
}

await rebuildCss("inicio");

const cssWatchers = cssSourceDirectories.map((directory) =>
  watch(directory, (eventType, filename) => {
    if (eventType === "change" || eventType === "rename") queueCssRebuild(String(filename || ""));
  }),
);

const server = createServer((request, response) => {
  void serveFile(request, response);
});

server.listen(port, () => {
  console.log(`[dev] Sitio disponible en http://localhost:${port}/`);
  console.log("[dev] Los cambios en assets/css/core, components y pages se reconstruyen automáticamente.");
});

function shutdown() {
  cssWatchers.forEach((watcher) => watcher.close());
  server.close(() => process.exit(0));
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
