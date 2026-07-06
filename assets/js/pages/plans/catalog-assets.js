const DEFAULT_FOLDER = "894-toyota-yaris-hatchback";

const PLAN_IMAGE_FOLDERS = Object.freeze({
  894: DEFAULT_FOLDER,
});

const ANGLES = Object.freeze([
  { id: "front_left", label: "Frente izquierdo", file: "front_left.webp", position: "front-left" },
  { id: "front", label: "Frente", file: "front.webp", position: "front" },
  { id: "front_right", label: "Frente derecho", file: "front_right.webp", position: "front-right" },
  { id: "rear_right", label: "Trasera derecha", file: "rear_right.webp", position: "rear-right" },
  { id: "rear", label: "Trasera", file: "rear.webp", position: "rear" },
]);

const MONEY_IMAGE = Object.freeze({
  id: "money",
  label: "Plan de dinero",
  file: "plan-dinero-billetes.webp",
  position: "money",
  src: "/assets/img/plans/plan-dinero-billetes.webp",
});

const BRAND_LOGOS = Object.freeze([
  { name: "Volkswagen", aliases: ["VOLKSWAGEN", "VW.", "VW "], logo: "/assets/img/brand-logos/volkswagen.svg" },
  { name: "Chevrolet", aliases: ["CHEVROLET", "CHEV."], logo: "/assets/img/brand-logos/chevrolet.svg" },
  { name: "Citroen", aliases: ["CITROEN"], logo: "/assets/img/brand-logos/citroen.svg" },
  { name: "Peugeot", aliases: ["PEUGEOT"], logo: "/assets/img/brand-logos/peugeot.svg" },
  { name: "Renault", aliases: ["RENAULT"], logo: "/assets/img/brand-logos/renault.svg" },
  { name: "Toyota", aliases: ["TOYOTA"], logo: "/assets/img/brand-logos/toyota.svg" },
  { name: "Honda", aliases: ["HONDA"], logo: "/assets/img/brand-logos/honda.svg" },
  { name: "Gilera", aliases: ["GILERA"], logo: "/assets/img/brand-logos/gilera.svg" },
  { name: "Yamaha", aliases: ["YAMAHA"], logo: "/assets/img/brand-logos/yamaha.svg" },
  { name: "Bajaj", aliases: ["BAJAJ"], logo: "/assets/img/brand-logos/bajaj.svg" },
  { name: "Ford", aliases: ["FORD"], logo: "/assets/img/brand-logos/ford.svg" },
  { name: "Fiat", aliases: ["FIAT", "F."], logo: "/assets/img/brand-logos/fiat.svg" },
]);

function folderFor(article, { fallback = true } = {}) {
  const folder = PLAN_IMAGE_FOLDERS[article];
  return folder || (fallback ? DEFAULT_FOLDER : "");
}

function normalizeBrandSource(plan) {
  return ` ${plan?.brand || ""} ${plan?.officialName || ""} ${plan?.displayName || ""} `
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ");
}

function brandFromPlan(plan) {
  if (plan?.category !== "autos" && plan?.category !== "motos") return null;
  const source = normalizeBrandSource(plan);
  const match = BRAND_LOGOS.find((brand) => brand.aliases.some((alias) => source.includes(` ${alias}`)));
  if (!match) return null;

  return {
    name: match.name,
    logo: match.logo,
    logoAlt: match.name,
  };
}

function brandFromMetadata(metadata) {
  const brand = metadata?.brand || {};
  if (!brand.logo) return null;

  return {
    name: brand.name || "",
    logo: brand.logo,
    logoAlt: brand.name || "Logo de marca",
  };
}

async function loadFolderMetadata(folder) {
  if (!folder) return null;

  try {
    const response = await fetch(`/assets/img/plans/${folder}/metadata.json`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function withPlanMediaMetadata(items) {
  const metadataByFolder = new Map();

  await Promise.all(
    [...new Set(items.map((item) => folderFor(item?.article, { fallback: false })).filter(Boolean))].map(async (folder) => {
      metadataByFolder.set(folder, await loadFolderMetadata(folder));
    }),
  );

  return items.map((item) => {
    const folder = folderFor(item?.article, { fallback: false });
    const metadata = folder ? metadataByFolder.get(folder) : null;
    const brand = brandFromMetadata(metadata) || brandFromPlan(item);
    return brand ? { ...item, mediaMetadata: { brand } } : item;
  });
}

export function getPlanMedia(plan) {
  if (plan?.category === "dinero") {
    return {
      folder: "",
      brand: null,
      defaultAngle: MONEY_IMAGE.id,
      defaultImage: MONEY_IMAGE,
      images: [MONEY_IMAGE],
    };
  }

  const folder = folderFor(plan?.article);
  const basePath = `/assets/img/plans/${folder}`;
  const images = ANGLES.map((angle) => ({
    ...angle,
    src: `${basePath}/${angle.file}`,
  }));

  return {
    folder,
    brand: plan?.mediaMetadata?.brand || null,
    defaultAngle: "front_left",
    defaultImage: images.find((image) => image.id === "front_left") || images[0],
    images,
  };
}
