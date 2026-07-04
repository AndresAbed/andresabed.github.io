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

function folderFor(article) {
  return PLAN_IMAGE_FOLDERS[article] || DEFAULT_FOLDER;
}

export function getPlanMedia(plan) {
  const folder = folderFor(plan?.article);
  const basePath = `/assets/img/plans/${folder}`;
  const images = ANGLES.map((angle) => ({
    ...angle,
    src: `${basePath}/${angle.file}`,
  }));

  return {
    folder,
    defaultAngle: "front_left",
    defaultImage: images.find((image) => image.id === "front_left") || images[0],
    images,
  };
}
