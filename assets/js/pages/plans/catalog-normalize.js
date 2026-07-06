const CATEGORY_SLUGS = Object.freeze({
  Autos: "autos",
  Motos: "motos",
  Dinero: "dinero",
});

const SUBCATEGORY_SLUGS = Object.freeze({
  "Baja Gama": "baja-gama",
  "Alta Gama": "alta-gama",
  Utilitarios: "utilitarios",
});

const SUBCATEGORY_LABELS = Object.freeze({
  "Baja Gama": "Gama baja",
  "Alta Gama": "Gama alta",
});

const EXACT_NAME_ALIASES = Object.freeze({
  "HONDA XR300TORNADO+$500000 3CHA": "Honda XR 300 Tornado + $500.000",
  "HONDA XR300TORNADO+$500000 5CHA": "Honda XR 300 Tornado + $500.000",
  "HONDA XR300TORNADO+$200000": "Honda XR 300 Tornado + $200.000",
});

const DISPLAY_WORDS = Object.freeze({
  "CHEV.": "Chevrolet",
  "F.": "Fiat",
  "VW.": "Volkswagen",
  CHEV: "Chevrolet",
  CITROEN: "Citroën",
  F: "Fiat",
  FIAT: "Fiat",
  TOYOTA: "Toyota",
  CHEVROLET: "Chevrolet",
  RENAULT: "Renault",
  HONDA: "Honda",
  GILERA: "Gilera",
  VOLKSWAGEN: "Volkswagen",
  VW: "Volkswagen",
  AT: "AT",
  CVT: "CVT",
  DX: "DX",
  FZ: "FZ",
  HDI: "HDI",
  LS: "LS",
  MT: "MT",
  TB: "TB",
  TD: "TD",
  TDI: "TDI",
  TN: "TN",
  "T-CROSS": "T-Cross",
  XR: "XR",
  XRE: "XRE",
  ABS: "ABS",
  CD: "CD",
});

export function normalizeArtemisText(value) {
  const text = String(value || "").trim();
  if (!/[ÃÂ]/.test(text)) return text;

  try {
    const bytes = Uint8Array.from([...text].map((character) => character.charCodeAt(0) & 0xff));
    return new TextDecoder("utf-8").decode(bytes).trim();
  } catch {
    return text;
  }
}

export function slugify(value) {
  return normalizeArtemisText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function displayWord(word) {
  const upper = word.toUpperCase();
  if (DISPLAY_WORDS[upper]) return DISPLAY_WORDS[upper];
  if (/^\d+x\d+$/i.test(word)) return word.toLowerCase();
  if (/^\d+$/.test(word)) return word;
  return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
}

function titleCase(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map(displayWord)
    .join(" ");
}

export function normalizePlanName(rawName, article) {
  const officialName = normalizeArtemisText(rawName).replace(/\s+/g, " ").trim();
  if (!officialName) return "Plan a confirmar";
  if (EXACT_NAME_ALIASES[officialName]) return EXACT_NAME_ALIASES[officialName];
  if (/^ORDEN\s+DE\s+COMPRA/i.test(officialName)) return "Orden de compra";

  const normalized = officialName
    .replace(/\b(?:D|N|TB|TD|TN)\b/gi, "")
    .replace(/\bFURGON\b/gi, "Furgón")
    .replace(/\bFURG\.\s*/gi, "Furgón ")
    .replace(/\bXR\s*300\s*TORNADO\b/gi, "XR 300 Tornado")
    .replace(/\bXR300TORNADO\b/gi, "XR 300 Tornado")
    .replace(/\bXR\s*(\d{3})\b/gi, "XR $1")
    .replace(/\bFZ\s*25\b/gi, "FZ 25")
    .replace(/\bSMASH\s*110\b/gi, "Smash 110")
    .replace(/\bWAVE\s*110\b/gi, "Wave 110")
    .replace(/\b\d+\s*P\b/gi, "")
    .replace(/\b\d+\s*PUERTAS?\b/gi, "")
    .replace(/\b(?:DOS|TRES|CUATRO|CINCO)\s+PUERTAS?\b/gi, "")
    .replace(/\bC\/S\b|\bCS\b/gi, "")
    .replace(/\bC\/D\b|\bCD\b/gi, "")
    .replace(/\bCABINA\s+(?:SIMPLE|DOBLE)\b/gi, "")
    .replace(/\b\d+\s*(?:CHA|CHANC|CHANCE|CHANCES)\b/gi, "")
    .replace(/\+/g, " + ")
    .replace(/\+\s*(\d{4,})/g, (_, amount) => `+ $${Number(amount).toLocaleString("es-AR")}`)
    .replace(/\$(\d{4,})/g, (_, amount) => `$${Number(amount).toLocaleString("es-AR")}`)
    .replace(/\s+/g, " ")
    .trim();

  if (normalized === "ORDEN DE COMPRA") return "Orden de compra";
  return titleCase(normalized);
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function moneyValue(value) {
  const number = numberOrNull(value);
  return number === null ? null : Math.round(number);
}

function categoryFrom(value) {
  const label = normalizeArtemisText(value) || "Sin categoría";
  return {
    label,
    slug: CATEGORY_SLUGS[label] || slugify(label),
  };
}

function subcategoryFrom(value) {
  const label = normalizeArtemisText(value);
  if (!label || label === "-") return { label: "", slug: "" };
  return {
    label: SUBCATEGORY_LABELS[label] || label,
    slug: SUBCATEGORY_SLUGS[label] || slugify(label),
  };
}

export function normalizeLivePlan(row) {
  const article = numberOrNull(row?.articulo);
  const plan = numberOrNull(row?.plan);
  const order = numberOrNull(row?.orden) || 9999;
  const officialName = normalizeArtemisText(row?.descsart);
  const category = categoryFrom(row?.cate);
  const subcategory = subcategoryFrom(row?.subcate);
  const displayName = normalizePlanName(officialName, article);

  return {
    id: `plan-${article || slugify(displayName)}`,
    article,
    plan,
    order,
    officialName,
    displayName,
    searchText: [article, officialName, displayName, category.label, subcategory.label].filter(Boolean).join(" ").toLowerCase(),
    category: category.slug,
    categoryLabel: category.label,
    subcategory: subcategory.slug,
    subcategoryLabel: subcategory.label,
    monthlyFee: moneyValue(row?.impocuo),
    nominalValue: moneyValue(row?.impovn),
    prizeChances: numberOrNull(row?.cantprem),
    source: "artemis_api",
  };
}

export function normalizeSnapshotPlan(item) {
  const category = categoryFrom(item?.category);
  const subcategory = subcategoryFrom(item?.subCategory);
  const article = numberOrNull(item?.officialArticle);
  const displayName = normalizePlanName(item?.officialName || item?.displayName, article);

  return {
    id: `plan-${article || item?.id || slugify(displayName)}`,
    article,
    plan: numberOrNull(item?.officialPlan),
    order: numberOrNull(item?.officialOrder) || 9999,
    officialName: item?.officialName || item?.displayName || "",
    displayName,
    searchText: [article, item?.officialName, displayName, item?.category, item?.subCategory].filter(Boolean).join(" ").toLowerCase(),
    category: category.slug,
    categoryLabel: category.label,
    subcategory: subcategory.slug,
    subcategoryLabel: subcategory.label,
    monthlyFee: moneyValue(item?.cuota?.value),
    nominalValue: moneyValue(item?.valorNominal?.value),
    prizeChances: numberOrNull(item?.chances?.value),
    source: "local_snapshot_fallback",
  };
}

function sortByOfficialOrder(items) {
  return [...items].sort((a, b) => {
    if ((a.order || 9999) !== (b.order || 9999)) return (a.order || 9999) - (b.order || 9999);
    return a.displayName.localeCompare(b.displayName, "es");
  });
}

function interleaveByCategory(items) {
  const groups = new Map();
  items.forEach((item) => {
    const key = item.category || "default";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });

  const preferredSequence = ["autos", "motos", "autos", "dinero"];
  const preferredSet = new Set(preferredSequence);
  const output = [];

  while (output.length < items.length) {
    let added = false;

    preferredSequence.forEach((key) => {
      const group = groups.get(key);
      if (group?.length) {
        output.push(group.shift());
        added = true;
      }
    });

    groups.forEach((group, key) => {
      if (!preferredSet.has(key) && group.length) {
        output.push(group.shift());
        added = true;
      }
    });

    if (!added) break;
  }

  return output;
}

export function sortPlans(items) {
  return interleaveByCategory(sortByOfficialOrder(items));
}
