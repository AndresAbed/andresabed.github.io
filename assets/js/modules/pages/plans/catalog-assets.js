const PLAN_IMAGE_FOLDERS = Object.freeze({
  887: "887-renault-kwid",
  888: "888-fiat-mobi",
  891: "891-chevrolet-onix",
  892: "892-chevrolet-onix-plus",
  893: "893-renault-sandero",
  894: "894-toyota-yaris",
  895: "895-fiat-cronos",
  897: "897-citroen-c3",
  898: "898-renault-stepway",
  900: "900-volkswagen-polo",
  901: "901-volkswagen-virtus",
  902: "902-citroen-c3-aircross",
  903: "903-fiat-fiorino",
  904: "904-fiat-strada",
  905: "905-peugeot-208",
  907: "907-citroen-berlingo",
  910: "910-toyota-corolla",
  911: "911-volkswagen-nivus",
  912: "912-chevrolet-tracker",
  913: "913-volkswagen-t-cross",
  914: "914-volkswagen-saveiro",
  915: "915-renault-kangoo-express",
  916: "916-peugeot-2008",
  917: "917-renault-duster",
  919: "919-renault-oroch",
  921: "921-fiat-toro-freedom",
  922: "922-ford-ranger",
  923: "923-toyota-hilux",
  924: "924-volkswagen-amarok",
  925: "925-chevrolet-s-10",
  926: "926-renault-alaskan",
  927: "927-chevrolet-montana",
  928: "928-ford-ranger",
  929: "929-fiat-ducato-furgon-corto",
  930: "930-ford-e-transit",
  931: "931-peugeot-boxer",
  932: "932-renault-master",
  944: "944-renault-logan",
  945: "945-citroen-c4",
  946: "946-peugeot-partner",
  947: "947-renault-kardian",
  948: "948-toyota-corolla-cross",
  949: "949-fiat-pulse",
  950: "950-fiat-fastback-turbo",
  951: "951-volkswagen-taos",
  957: "957-toyota-hiace",
  963: "963-fiat-cronos",
  964: "964-fiat-cronos",
  965: "965-fiat-cronos",
  966: "966-toyota-hilux",
});

const ANGLES = Object.freeze([
  { id: "front_left", label: "Frente izquierdo", file: "front-left.webp", position: "front-left" },
  { id: "front", label: "Frente", file: "front.webp", position: "front" },
  { id: "front_right", label: "Frente derecho", file: "front-right.webp", position: "front-right" },
  { id: "rear_right", label: "Trasera derecha", file: "rear-right.webp", position: "rear-right" },
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
  { name: "Volkswagen", aliases: ["VOLKSWAGEN", "VW.", "VW "], logo: "/assets/img/brand-logos/volkswagen.svg", logoRatio: 5.94 },
  { name: "Chevrolet", aliases: ["CHEVROLET", "CHEV."], logo: "/assets/img/brand-logos/chevrolet.svg", logoRatio: 11.01 },
  { name: "Citroën", aliases: ["CITROEN"], logo: "/assets/img/brand-logos/citroen.svg", logoRatio: 8.01 },
  { name: "Peugeot", aliases: ["PEUGEOT"], logo: "/assets/img/brand-logos/peugeot.svg", logoRatio: 9.43 },
  { name: "Renault", aliases: ["RENAULT"], logo: "/assets/img/brand-logos/renault.svg", logoRatio: 7.86 },
  { name: "Toyota", aliases: ["TOYOTA"], logo: "/assets/img/brand-logos/toyota.svg", logoRatio: 5.64 },
  { name: "Honda", aliases: ["HONDA"], logo: "/assets/img/brand-logos/honda.svg", logoRatio: 8.22 },
  { name: "Gilera", aliases: ["GILERA"], logo: "/assets/img/brand-logos/gilera.svg", logoRatio: 9.51 },
  { name: "Yamaha", aliases: ["YAMAHA"], logo: "/assets/img/brand-logos/yamaha.svg", logoRatio: 5.27 },
  { name: "Bajaj", aliases: ["BAJAJ"], logo: "/assets/img/brand-logos/bajaj.svg", logoRatio: 6.72 },
  { name: "Ford", aliases: ["FORD"], logo: "/assets/img/brand-logos/ford.svg", logoRatio: 2.92 },
  { name: "Fiat", aliases: ["FIAT", "F."], logo: "/assets/img/brand-logos/fiat.svg", logoRatio: 1.63 },
]);

function folderFor(article) {
  return PLAN_IMAGE_FOLDERS[article] || "";
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
    logoRatio: match.logoRatio,
  };
}

function brandFromMetadata(metadata) {
  const brand = metadata?.brand || {};
  if (!brand.logo) return null;
  const mappedBrand = BRAND_LOGOS.find((item) => item.logo === brand.logo || item.name.toLowerCase() === String(brand.name || "").toLowerCase());

  return {
    name: brand.name || mappedBrand?.name || "",
    logo: brand.logo,
    logoAlt: brand.name || mappedBrand?.name || "Logo de marca",
    logoRatio: brand.logoRatio || mappedBrand?.logoRatio || 5,
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

function normalizeMetadataImages(folder, metadata) {
  const images = Array.isArray(metadata?.images) && metadata.images.length ? metadata.images : ANGLES;
  return images
    .filter((image) => image?.file)
    .map((image) => {
      const angle = ANGLES.find((item) => item.id === image.id || item.file === image.file) || {};
      return {
        ...angle,
        ...image,
        src: `/assets/img/plans/${folder}/${image.file}`,
      };
    });
}

export async function withPlanMediaMetadata(items) {
  const metadataByFolder = new Map();

  await Promise.all(
    [...new Set(items.map((item) => folderFor(item?.article)).filter(Boolean))].map(async (folder) => {
      metadataByFolder.set(folder, await loadFolderMetadata(folder));
    }),
  );

  return items.map((item) => {
    const folder = folderFor(item?.article);
    const metadata = folder ? metadataByFolder.get(folder) : null;
    const brand = brandFromMetadata(metadata) || brandFromPlan(item);
    const fit = metadata?.mediaFit || "";
    const scale = metadata?.mediaScale || null;
    const position = metadata?.mediaPosition || null;
    const images = folder && metadata ? normalizeMetadataImages(folder, metadata) : [];
    return folder || brand || fit || scale || position ? { ...item, mediaMetadata: { folder, brand, fit, scale, position, images } } : item;
  });
}

export function getPlanMedia(plan) {
  if (plan?.category === "dinero") {
    return {
      folder: "",
      brand: null,
      fit: "",
      hasImage: true,
      defaultAngle: MONEY_IMAGE.id,
      defaultImage: MONEY_IMAGE,
      images: [MONEY_IMAGE],
    };
  }

  const folder = folderFor(plan?.article);
  if (!folder) {
    return {
      folder: "",
      brand: plan?.mediaMetadata?.brand || null,
      fit: "",
      scale: null,
      position: null,
      hasImage: false,
      defaultAngle: "",
      defaultImage: null,
      images: [],
    };
  }

  const images =
    Array.isArray(plan?.mediaMetadata?.images) && plan.mediaMetadata.images.length
      ? plan.mediaMetadata.images
      : ANGLES.map((angle) => ({
          ...angle,
          src: `/assets/img/plans/${folder}/${angle.file}`,
        }));

  return {
    folder,
    brand: plan?.mediaMetadata?.brand || null,
    fit: plan?.mediaMetadata?.fit || "",
    scale: plan?.mediaMetadata?.scale || null,
    position: plan?.mediaMetadata?.position || null,
    hasImage: images.length > 0,
    defaultAngle: images.find((image) => image.id === "front_left")?.id || images[0]?.id || "",
    defaultImage: images.find((image) => image.id === "front_left") || images[0] || null,
    images,
  };
}
