import fs from "node:fs";
import path from "node:path";

const inputPath = process.argv[2] || "/private/tmp/csj-official/catalog.json";
const outputPath = process.argv[3] || "data/plan_catalog.json";
const officialImageBase = "https://artemis.clubsanjorge.com.ar/images/";

const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const rows = Array.isArray(raw) ? raw : raw.data || raw.rows || [];

const categoryConfig = {
  Autos: {
    slug: "autos",
    label: "Autos",
    shortLabel: "Autos",
    sortOrder: 1,
    theme: "red",
    description:
      "Opciones orientadas a autos 0 km y utilitarios dentro del sistema de Capitalizacion y Ahorro.",
    summary: "Para comparar referencias de auto, valor nominal, cuota mensual y chances de sorteo.",
  },
  Motos: {
    slug: "motos",
    label: "Motos",
    shortLabel: "Motos",
    sortOrder: 2,
    theme: "green",
    description:
      "Opciones orientadas a motos dentro del sistema de Capitalizacion y Ahorro.",
    summary: "Para elegir una referencia de moto y revisar cuotas, valor nominal y condiciones.",
  },
  Dinero: {
    slug: "dinero",
    label: "Dinero",
    shortLabel: "Dinero",
    sortOrder: 3,
    theme: "dark",
    description:
      "Opciones de orden de compra / capital segun valor nominal dentro del sistema.",
    summary: "Para quienes priorizan formar capital y comparar montos de cuota y valor nominal.",
  },
};

const featuredArticles = new Set([
  964, // FIAT CRONOS
  966, // TOYOTA HILUX
  967, // HONDA XR300
  880, // GILERA SMASH
  938, // ORDEN DE COMPRA
  969, // ORDEN DE COMPRA
]);

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function roundCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
  return Math.round(Number(value));
}

function titleCase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .replace(/\bCd\b/g, "CD")
    .replace(/\b4x4\b/gi, "4x4")
    .replace(/\b0km\b/gi, "0 km");
}

function categorySlug(category) {
  return categoryConfig[category]?.slug || slugify(category);
}

function descriptionFor(row) {
  const category = row.cate;
  const reference = titleCase(row.descsart);
  const cuota = roundCurrency(row.impocuo);
  const chances = Number(row.cantprem || 0);
  const chanceText = chances > 1 ? `${chances} chances` : `${chances || 1} chance`;

  if (category === "Dinero") {
    return `Orden de compra / capital con cuota de referencia ${formatMoney(cuota)} y ${chanceText} de sorteo, segun catalogo vigente.`;
  }

  return `Referencia ${reference} con cuota de catalogo ${formatMoney(cuota)} y ${chanceText} de sorteo.`;
}

function formatMoney(value) {
  if (!value) return "a confirmar";
  return `$${new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

function itemFromRow(row, index) {
  const category = categorySlug(row.cate);
  const officialName = String(row.descsart || "").trim();
  const displayName = row.cate === "Dinero" ? "Orden de compra / capital" : titleCase(officialName);
  const subCategory = row.subcate ? String(row.subcate).trim() : "";
  const articulo = Number(row.articulo);
  const cuota = roundCurrency(row.impocuo);
  const valorNominal = roundCurrency(row.impovn);
  const chances = Number(row.cantprem || 0);
  const slug = `${category}-${slugify(officialName)}-${articulo || index + 1}`;

  return {
    id: slug,
    slug,
    category,
    subCategory,
    displayName,
    officialName,
    brand: "",
    model: "",
    planLabel: `Articulo ${articulo || "-"} / Plan ${row.plan || "-"}`,
    officialArticle: articulo || null,
    imageUrl: articulo ? `${officialImageBase}${articulo}.webp` : "",
    officialPlan: Number(row.plan) || null,
    officialOrder: Number(row.orden) || index + 1,
    months: {
      value: 330,
      status: "verified",
    },
    valorNominal: {
      value: valorNominal,
      status: valorNominal ? "verified" : "pending_validation",
    },
    cuota: {
      value: cuota,
      status: cuota ? "verified" : "pending_validation",
    },
    chances: {
      value: chances || 1,
      status: "verified",
    },
    currency: "ARS",
    status: "active",
    featured: featuredArticles.has(articulo),
    description: descriptionFor(row),
    notes: [
      {
        text: "Importes tomados del catalogo oficial activo al momento de generar el snapshot.",
        status: "verified",
      },
      {
        text: "La solicitud formal debe revisarse con documentacion y condiciones vigentes.",
        status: "verified",
      },
    ],
    faqRefs: [
      "de-cuantas-cuotas-consta-el-plan",
      "como-se-realizan-los-sorteos-mensuales",
      "si-no-pago-la-cuota-y-salgo-sorteado",
      "que-se-obtiene-al-final-del-plan-330",
    ],
    contactPreset: slug,
    sourceStatus: "official_catalog_snapshot",
  };
}

const categories = Object.values(categoryConfig);
const items = rows
  .filter((row) => Number(row.activo) === 1)
  .sort((a, b) => {
    const categoryDiff = (categoryConfig[a.cate]?.sortOrder || 99) - (categoryConfig[b.cate]?.sortOrder || 99);
    if (categoryDiff) return categoryDiff;
    return Number(a.orden || 0) - Number(b.orden || 0);
  })
  .map(itemFromRow);

const subcategories = items.reduce((acc, item) => {
  if (!item.subCategory || item.subCategory === "-") return acc;
  acc[item.category] ||= [];
  if (!acc[item.category].includes(item.subCategory)) acc[item.category].push(item.subCategory);
  return acc;
}, {});

const output = {
  meta: {
    version: "v3-official-catalog-snapshot",
    generatedAt: new Date().toISOString(),
    sourceUrl:
      "https://artemis.clubsanjorge.com.ar/api/stream/whJeJzzt07DTV9RS7HIkGPND1uptZxvl/media/listapre",
    sourcePolicy:
      "Snapshot estatico del catalogo oficial activo de Club San Jorge. No consumir en vivo desde el navegador.",
    featuredCategorySlugs: ["autos", "motos", "dinero"],
    defaultMonths: {
      value: 330,
      status: "verified",
    },
    currency: "ARS",
    totalItems: items.length,
    subcategories,
  },
  categories,
  items,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${items.length} catalog items to ${outputPath}`);
