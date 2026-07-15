import fs from "node:fs";
import path from "node:path";

const ARTEMIS_BASE_URL = "https://artemis.clubsanjorge.com.ar";
const ARTEMIS_MEDIA_ROOT = `${ARTEMIS_BASE_URL}/api/stream/whJeJzzt07DTV9RS7HIkGPND1uptZxvl/media`;
const ARTEMIS_MEDIA_ISSUE_URL = `${ARTEMIS_MEDIA_ROOT}/issue`;
const ARTEMIS_WINNER_IMAGE_BASE = `${ARTEMIS_BASE_URL}/images/winners`;
const REQUEST_TIMEOUT_MS = 12000;
const ADJUDICATION_LOOKBACK_YEARS = 3;
const HOME_ADJUDICATION_TARGET_COUNT = 8;
const HOME_ADJUDICATION_FETCH_LIMIT = 16;

const backupPath = "data/artemis-backup.json";
const adjudicationImageDir = "assets/img/adjudicados";
const adjudicationImagePublicPath = "/assets/img/adjudicados";

const adjudicationColumns = Object.freeze([
  { key: "name", label: "Nombre" },
  { key: "address", label: "Domicilio" },
  { key: "locality", label: "Localidad" },
  { key: "installment", label: "Cuota" },
]);

const emptyDraws = Object.freeze({
  meta: {
    source: "artemis_api",
    status: "pending_validation",
  },
  schedule: {
    officialRule: "Los sorteos se realizan mediante la Lotería de la Ciudad de Buenos Aires / LOTBA, en la última jugada del último sábado de cada mes, salvo excepciones aprobadas.",
    status: "verified",
  },
  lastDraw: {
    date: "",
    status: "pending_validation",
    source: "artemis_api",
  },
  nextDraw: {
    date: "",
    status: "pending_validation",
    source: "artemis_api",
  },
  stimuli: [],
});

const emptyHomeAdjudications = Object.freeze({
  meta: {
    source: "artemis_api",
    status: "pending_validation",
  },
  section: {
    eyebrow: "Adjudicados",
    title: "Conocé a nuestros adjudicados",
    intro: "Historias reales de suscriptores que ya recibieron su premio.",
    cta: {
      label: "Ver más adjudicados",
      href: "/adjudicados/",
    },
  },
  items: [],
});

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function artemisUrl(baseUrl, query, options = {}) {
  const url = new URL(baseUrl);
  url.searchParams.set("q", JSON.stringify(query));
  url.searchParams.set("h", JSON.stringify(options));
  return url.toString();
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchBuffer(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeArtemisText(value) {
  const text = String(value || "").trim();
  if (!/[ÃÂ]/.test(text)) return text;

  try {
    const bytes = Uint8Array.from([...text].map((character) => character.charCodeAt(0) & 0xff));
    return new TextDecoder("utf-8").decode(bytes).trim();
  } catch {
    return text;
  }
}

function slugify(value) {
  return normalizeArtemisText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function dateFromArtemisSegment(value) {
  return normalizeArtemisText(value).split(";")[0]?.trim() || "";
}

function parseDrawsFromArtemis(payload, fallback) {
  const issueDescr = payload?.[0]?.issue_descr || [];
  const numbers = normalizeArtemisText(issueDescr[0])
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
  const lastDate = dateFromArtemisSegment(issueDescr[1]);
  const nextDate = dateFromArtemisSegment(issueDescr[2]);

  if (numbers.length < 3 || !lastDate || !nextDate) return fallback;

  return {
    ...fallback,
    meta: {
      ...(fallback?.meta || {}),
      source: "artemis_api",
      status: "verified",
    },
    lastDraw: {
      ...(fallback?.lastDraw || {}),
      date: lastDate ? `${lastDate} LOTBA` : fallback?.lastDraw?.date,
      status: "verified",
      source: "artemis_api",
    },
    nextDraw: {
      ...(fallback?.nextDraw || {}),
      date: nextDate || fallback?.nextDraw?.date,
      status: "verified",
      source: "artemis_api",
    },
    stimuli: numbers.map((winningNumber, index) => ({
      position: index + 1,
      label: `${index + 1}° Estímulo`,
      winningNumber,
      status: "verified",
      source: "artemis_api",
    })),
  };
}

function installmentFromArtemisDetail(value) {
  const rawInstallment = normalizeArtemisText(value).split(";")[0]?.trim() || "";
  const numericInstallment = Number(rawInstallment);
  return Number.isFinite(numericInstallment) && rawInstallment ? String(numericInstallment) : rawInstallment;
}

function drawDateFromArtemisDetail(value) {
  return normalizeArtemisText(value).split(";")[1]?.trim() || "";
}

function adjudicationDrawFromArtemisDetail(value) {
  const segments = normalizeArtemisText(value)
    .split(";")
    .map((segment) => segment.trim());
  const date = segments[1] || "";
  const nextDate = segments[2] || "";
  const winningNumbers = segments.slice(3, 6).filter(Boolean);

  if (!date && !nextDate && !winningNumbers.length) return null;

  const complete = Boolean(date && nextDate && winningNumbers.length === 3);
  const labels = ["1.er estímulo", "2.º estímulo", "3.er estímulo"];

  return {
    date,
    nextDate,
    stimuli: winningNumbers.map((winningNumber, index) => ({
      position: index + 1,
      label: labels[index],
      winningNumber,
      status: "verified",
      source: "artemis_api",
    })),
    status: complete ? "verified" : "partial",
    source: "artemis_api",
  };
}

function parseAdjudicationDrawFromArtemis(payload) {
  return (Array.isArray(payload) ? payload : [])
    .map((entry) => adjudicationDrawFromArtemisDetail(entry?.issue_descr?.[3]))
    .find((draw) => draw?.stimuli?.length || draw?.date || draw?.nextDate) || null;
}

function parseAdjudicationsFromArtemis(payload) {
  return (Array.isArray(payload) ? payload : [])
    .map((entry) => {
      const issueDescr = entry?.issue_descr || [];
      const name = normalizeArtemisText(issueDescr[0]);
      const address = normalizeArtemisText(issueDescr[1]);
      const locality = normalizeArtemisText(issueDescr[2]);
      const installment = installmentFromArtemisDetail(issueDescr[3]);

      if (!name) return null;

      return {
        name,
        address,
        locality,
        installment,
        source: "artemis_api",
      };
    })
    .filter(Boolean);
}

function parseHomeAdjudicationItemsFromArtemis(payload) {
  return (Array.isArray(payload) ? payload : [])
    .map((entry, index) => {
      const issueDescr = entry?.issue_descr || [];
      const name = normalizeArtemisText(issueDescr[0]);
      const residence = normalizeArtemisText(issueDescr[2]);
      const detail = normalizeArtemisText(issueDescr[3]);
      const prize = normalizeArtemisText(issueDescr[4]);
      const imageNumber = normalizeArtemisText(issueDescr[5]);
      const installment = installmentFromArtemisDetail(detail);
      const drawDate = drawDateFromArtemisDetail(detail);

      if (!name || !installment || !drawDate || !prize || !imageNumber) return null;

      return {
        id: slugify(`${name}-${imageNumber}`) || `adjudicado-${index + 1}`,
        imageNumber,
        name,
        installment,
        drawDate,
        prize,
        residence,
        imageUrl: `${ARTEMIS_WINNER_IMAGE_BASE}/${imageNumber}.webp`,
        remoteImageUrl: `${ARTEMIS_WINNER_IMAGE_BASE}/${imageNumber}.webp`,
        source: "artemis_api",
      };
    })
    .filter(Boolean)
    .slice(0, HOME_ADJUDICATION_TARGET_COUNT);
}

function createHomeAdjudicationsFromItems(items, fallback) {
  if (items.length < HOME_ADJUDICATION_TARGET_COUNT) return fallback;

  return {
    ...fallback,
    meta: {
      ...(fallback?.meta || {}),
      source: "artemis_api",
      status: "verified",
    },
    items,
  };
}

function padTwoDigits(value) {
  return String(value).padStart(2, "0");
}

function issueSummaryFromPeriod(year, month) {
  return `01/${padTwoDigits(month)}/${year}`;
}

function adjudicationPeriodKeys() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const startYear = currentYear - ADJUDICATION_LOOKBACK_YEARS + 1;
  const periods = [];

  for (let year = startYear; year <= currentYear; year += 1) {
    const maxMonth = year === currentYear ? today.getMonth() : 12;
    for (let month = 1; month <= maxMonth; month += 1) {
      periods.push({
        key: `${year}-${padTwoDigits(month)}`,
        year,
        month,
      });
    }
  }

  return periods;
}

async function fetchDraws(previousBackup, errors) {
  try {
    const payload = await fetchJson(
      artemisUrl(
        ARTEMIS_MEDIA_ISSUE_URL,
        { related_project: "SORTEO", issue_summary: "ULTIMO" },
        { columns: ["issue_descr"] },
      ),
    );
    return parseDrawsFromArtemis(payload, emptyDraws);
  } catch (error) {
    const message = `No se pudo actualizar sorteos: ${error.message}`;
    errors.push(message);
    console.warn(message);
    return previousBackup?.draws || emptyDraws;
  }
}

async function fetchHomeAdjudications(previousBackup, errors) {
  try {
    const payload = await fetchJson(
      artemisUrl(
        ARTEMIS_MEDIA_ISSUE_URL,
        { assigned_to: 6, status: "CLOSED", related_project: "ADJUDI" },
        { columns: ["issue_descr"], offset: 0, limit: HOME_ADJUDICATION_FETCH_LIMIT },
      ),
    );
    const previousHomeAdjudications = previousBackup?.homeAdjudications || emptyHomeAdjudications;
    const items = parseHomeAdjudicationItemsFromArtemis(payload);

    if (items.length < HOME_ADJUDICATION_TARGET_COUNT) {
      const message = `Artemis devolvió ${items.length}/${HOME_ADJUDICATION_TARGET_COUNT} adjudicados destacados válidos; se mantiene el backup anterior.`;
      errors.push(message);
      console.warn(message);
      return previousHomeAdjudications;
    }

    return createHomeAdjudicationsFromItems(items, previousHomeAdjudications);
  } catch (error) {
    const message = `No se pudieron actualizar adjudicados destacados: ${error.message}`;
    errors.push(message);
    console.warn(message);
    return previousBackup?.homeAdjudications || emptyHomeAdjudications;
  }
}

function localAdjudicationImagePath(imageNumber) {
  return path.join(adjudicationImageDir, `${imageNumber}.webp`);
}

function localAdjudicationImageUrl(imageNumber) {
  return `${adjudicationImagePublicPath}/${imageNumber}.webp`;
}

function imageNumberFromItem(item) {
  return String(item?.imageNumber || item?.id?.match?.(/-(\d+)$/)?.[1] || "").trim();
}

function collectReferencedImageNumbers(homeAdjudications) {
  return new Set(
    (homeAdjudications?.items || [])
      .map(imageNumberFromItem)
      .filter(Boolean),
  );
}

function hasLocalAdjudicationImage(item) {
  const imageNumber = imageNumberFromItem(item);
  if (!imageNumber) return false;

  const localUrl = localAdjudicationImageUrl(imageNumber);
  return (item?.imageUrl === localUrl || item?.localImageUrl === localUrl) && fs.existsSync(localAdjudicationImagePath(imageNumber));
}

async function downloadAdjudicationImage(item, previousItem, errors) {
  const imageNumber = String(item?.imageNumber || "").trim();
  if (!imageNumber) return item;

  const localPath = localAdjudicationImagePath(imageNumber);
  const localUrl = localAdjudicationImageUrl(imageNumber);
  const remoteUrl = item.remoteImageUrl || item.imageUrl || `${ARTEMIS_WINNER_IMAGE_BASE}/${imageNumber}.webp`;

  fs.mkdirSync(adjudicationImageDir, { recursive: true });

  if (!fs.existsSync(localPath)) {
    try {
      const buffer = await fetchBuffer(remoteUrl);
      fs.writeFileSync(localPath, buffer);
      console.log(`Saved adjudication image ${localPath}`);
    } catch (error) {
      const hadPreviousLocalImage =
        previousItem?.imageUrl === localUrl ||
        previousItem?.localImageUrl === localUrl ||
        fs.existsSync(localPath);

      if (!hadPreviousLocalImage) {
        const message = `No se pudo respaldar imagen adjudicado ${imageNumber}: ${error.message}`;
        errors.push(message);
        console.warn(message);
        return {
          ...item,
          imageUrl: "",
          localImageUrl: "",
          remoteImageUrl: remoteUrl,
        };
      }

      console.warn(`Se mantiene imagen local previa para adjudicado ${imageNumber}: ${error.message}`);
    }
  }

  return {
    ...item,
    imageUrl: localUrl,
    localImageUrl: localUrl,
    remoteImageUrl: remoteUrl,
  };
}

async function backupHomeAdjudicationImages(homeAdjudications, previousBackup, errors) {
  const previousHomeAdjudications = previousBackup?.homeAdjudications || emptyHomeAdjudications;
  const previousItemsByImageNumber = new Map(
    (previousHomeAdjudications?.items || [])
      .map((item) => {
        const imageNumber = imageNumberFromItem(item);
        return imageNumber ? [imageNumber, item] : null;
      })
      .filter(Boolean),
  );

  const items = await Promise.all(
    (homeAdjudications?.items || []).map((item) =>
      downloadAdjudicationImage(item, previousItemsByImageNumber.get(String(item.imageNumber)), errors),
    ),
  );
  const nextHomeAdjudications = {
    ...homeAdjudications,
    items,
  };

  const readyImageCount = items.filter(hasLocalAdjudicationImage).length;
  const previousReadyImageCount = (previousHomeAdjudications?.items || []).filter(hasLocalAdjudicationImage).length;

  if (readyImageCount < HOME_ADJUDICATION_TARGET_COUNT && previousReadyImageCount >= HOME_ADJUDICATION_TARGET_COUNT) {
    const message = `El backup nuevo dejó ${readyImageCount}/${HOME_ADJUDICATION_TARGET_COUNT} imágenes locales listas; se mantiene el backup anterior.`;
    errors.push(message);
    console.warn(message);
    return previousHomeAdjudications;
  }

  return nextHomeAdjudications;
}

function pruneUnusedAdjudicationImages(homeAdjudications) {
  if (!fs.existsSync(adjudicationImageDir)) return [];

  const referenced = collectReferencedImageNumbers(homeAdjudications);
  const removed = [];

  fs.readdirSync(adjudicationImageDir, { withFileTypes: true }).forEach((entry) => {
    if (!entry.isFile() || !entry.name.endsWith(".webp")) return;

    const imageNumber = entry.name.replace(/(?:-\d+)?\.webp$/i, "");
    if (referenced.has(imageNumber)) return;

    const filePath = path.join(adjudicationImageDir, entry.name);
    fs.unlinkSync(filePath);
    removed.push(filePath);
  });

  return removed;
}

async function fetchAdjudicationsForPeriod(period, previousBackup, errors) {
  try {
    const payload = await fetchJson(
      artemisUrl(
        ARTEMIS_MEDIA_ISSUE_URL,
        { related_project: "ADJUDI", issue_summary: issueSummaryFromPeriod(period.year, period.month) },
        { columns: ["issue_descr"] },
      ),
    );

    return {
      meta: {
        source: "artemis_api",
        status: "verified",
        year: period.year,
        month: period.month,
      },
      draw: parseAdjudicationDrawFromArtemis(payload),
      rows: parseAdjudicationsFromArtemis(payload),
    };
  } catch (error) {
    const message = `No se pudieron actualizar adjudicados ${period.key}: ${error.message}`;
    errors.push(message);
    console.warn(message);
    return previousBackup?.adjudications?.periods?.[period.key] || {
      meta: {
        source: "artemis_api",
        status: "pending_validation",
        year: period.year,
        month: period.month,
      },
      draw: null,
      rows: [],
    };
  }
}

async function main() {
  const previousBackup = readJson(backupPath, {});
  const errors = [];
  const generatedAt = new Date().toISOString();

  const draws = await fetchDraws(previousBackup, errors);
  const fetchedHomeAdjudications = await fetchHomeAdjudications(previousBackup, errors);
  const homeAdjudications = await backupHomeAdjudicationImages(fetchedHomeAdjudications, previousBackup, errors);
  const removedImages = pruneUnusedAdjudicationImages(homeAdjudications);
  removedImages.forEach((filePath) => console.log(`Removed unused adjudication image ${filePath}`));
  const periods = {};

  for (const period of adjudicationPeriodKeys()) {
    periods[period.key] = await fetchAdjudicationsForPeriod(period, previousBackup, errors);
  }

  writeJson(backupPath, {
    meta: {
      source: "artemis_api",
      status: errors.length ? "partial" : "verified",
      generatedAt,
      lookbackYears: ADJUDICATION_LOOKBACK_YEARS,
      errors,
    },
    draws,
    homeAdjudications,
    adjudications: {
      columns: adjudicationColumns,
      periods,
    },
  });

  console.log(`Wrote Artemis backup to ${backupPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
