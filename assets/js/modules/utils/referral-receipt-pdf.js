const CAPTURE_SCALE = 2;
const CAPTURE_PADDING = 28;
const PDF_POINTS_PER_CSS_PIXEL = 0.75;

function asciiBytes(value) {
  return new TextEncoder().encode(value);
}

function concatBytes(parts) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;

  parts.forEach((part) => {
    result.set(part, offset);
    offset += part.length;
  });

  return result;
}

function roundedRectPath(context, x, y, width, height, radii = {}) {
  const topLeft = Math.min(radii.topLeft || 0, width / 2, height / 2);
  const topRight = Math.min(radii.topRight || 0, width / 2, height / 2);
  const bottomRight = Math.min(radii.bottomRight || 0, width / 2, height / 2);
  const bottomLeft = Math.min(radii.bottomLeft || 0, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + topLeft, y);
  context.lineTo(x + width - topRight, y);
  context.quadraticCurveTo(x + width, y, x + width, y + topRight);
  context.lineTo(x + width, y + height - bottomRight);
  context.quadraticCurveTo(x + width, y + height, x + width - bottomRight, y + height);
  context.lineTo(x + bottomLeft, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - bottomLeft);
  context.lineTo(x, y + topLeft);
  context.quadraticCurveTo(x, y, x + topLeft, y);
  context.closePath();
}

function elementRadii(element) {
  const style = window.getComputedStyle(element);
  return {
    topLeft: parseFloat(style.borderTopLeftRadius) || 0,
    topRight: parseFloat(style.borderTopRightRadius) || 0,
    bottomRight: parseFloat(style.borderBottomRightRadius) || 0,
    bottomLeft: parseFloat(style.borderBottomLeftRadius) || 0,
  };
}

function relativeBounds(element, panelBounds) {
  const bounds = element.getBoundingClientRect();
  return {
    x: bounds.left - panelBounds.left + CAPTURE_PADDING,
    y: bounds.top - panelBounds.top + CAPTURE_PADDING,
    width: bounds.width,
    height: bounds.height,
  };
}

function textLines(element, panelBounds) {
  const textNode = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
  const fallbackBounds = relativeBounds(element, panelBounds);
  if (!textNode) return [{ text: element.textContent.trim(), ...fallbackBounds }];

  const lines = [];
  const expression = /\S+(?:\s+|$)/gu;
  let match;

  while ((match = expression.exec(textNode.textContent)) !== null) {
    const range = document.createRange();
    range.setStart(textNode, match.index);
    range.setEnd(textNode, match.index + match[0].length);
    const bounds = range.getBoundingClientRect();
    range.detach();
    if (!bounds.width && !bounds.height) continue;

    const y = bounds.top - panelBounds.top + CAPTURE_PADDING;
    const current = lines.at(-1);
    if (current && Math.abs(current.y - y) < 2) {
      current.text = `${current.text} ${match[0].trim()}`;
      current.height = Math.max(current.height, bounds.height);
    } else {
      lines.push({
        text: match[0].trim(),
        x: fallbackBounds.x,
        y,
        width: fallbackBounds.width,
        height: bounds.height || fallbackBounds.height,
      });
    }
  }

  return lines.length ? lines : [{ text: element.textContent.trim(), ...fallbackBounds }];
}

function drawTextElement(context, element, panelBounds) {
  if (!element) return;
  const style = window.getComputedStyle(element);
  context.save();
  context.fillStyle = style.color;
  context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  context.textAlign = style.textAlign === "left" || style.textAlign === "start" ? "left" : "center";
  context.textBaseline = "alphabetic";
  if ("letterSpacing" in context) context.letterSpacing = style.letterSpacing;

  textLines(element, panelBounds).forEach((line) => {
    const metrics = context.measureText(line.text);
    const visualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    const x = context.textAlign === "left" ? line.x : line.x + line.width / 2;
    const y = line.y + line.height / 2 + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
    context.fillText(line.text, x, visualHeight ? y : line.y + line.height);
  });

  context.restore();
}

function drawPanel(context, element, panelBounds) {
  const style = window.getComputedStyle(element);
  const x = CAPTURE_PADDING;
  const y = CAPTURE_PADDING;

  context.save();
  context.shadowColor = "rgba(41, 41, 41, 0.16)";
  context.shadowBlur = 30;
  context.shadowOffsetY = 14;
  context.fillStyle = style.backgroundColor || "#ffffff";
  roundedRectPath(context, x, y, panelBounds.width, panelBounds.height, elementRadii(element));
  context.fill();
  context.restore();

  context.save();
  context.strokeStyle = style.borderTopColor || "#c5dfc1";
  context.lineWidth = parseFloat(style.borderTopWidth) || 1;
  roundedRectPath(context, x + 0.5, y + 0.5, panelBounds.width - 1, panelBounds.height - 1, elementRadii(element));
  context.stroke();
  context.restore();
}

function drawCheck(context, mark, panelBounds) {
  if (!mark) return;
  const bounds = relativeBounds(mark, panelBounds);
  const style = window.getComputedStyle(mark);
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const borderWidth = parseFloat(style.borderTopWidth) || 8;

  context.save();
  context.fillStyle = style.borderTopColor || "#e5f4e2";
  context.beginPath();
  context.arc(centerX, centerY, bounds.width / 2, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = style.backgroundColor || "#61af54";
  context.beginPath();
  context.arc(centerX, centerY, bounds.width / 2 - borderWidth, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "#ffffff";
  context.lineWidth = 4;
  context.lineCap = "square";
  context.lineJoin = "miter";
  context.beginPath();
  context.moveTo(centerX - 10, centerY);
  context.lineTo(centerX - 3, centerY + 7);
  context.lineTo(centerX + 11, centerY - 8);
  context.stroke();
  context.restore();
}

function drawNumberBox(context, box, panelBounds) {
  if (!box) return;
  const bounds = relativeBounds(box, panelBounds);
  const style = window.getComputedStyle(box);
  context.save();
  context.fillStyle = style.backgroundColor || "#292929";
  roundedRectPath(context, bounds.x, bounds.y, bounds.width, bounds.height, elementRadii(box));
  context.fill();
  context.restore();
}

function renderElementToCanvas(element) {
  const panelBounds = element.getBoundingClientRect();
  if (!panelBounds.width || !panelBounds.height) throw new Error("El comprobante no está visible para generar el PDF.");

  const cssWidth = Math.ceil(panelBounds.width) + CAPTURE_PADDING * 2;
  const cssHeight = Math.ceil(panelBounds.height) + CAPTURE_PADDING * 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cssWidth * CAPTURE_SCALE);
  canvas.height = Math.round(cssHeight * CAPTURE_SCALE);
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("El navegador no pudo preparar el comprobante.");

  context.scale(CAPTURE_SCALE, CAPTURE_SCALE);
  context.fillStyle = "#f7f7f4";
  context.fillRect(0, 0, cssWidth, cssHeight);
  drawPanel(context, element, panelBounds);
  drawCheck(context, element.querySelector(".referral-success__mark"), panelBounds);
  drawNumberBox(context, element.querySelector(".referral-success__number"), panelBounds);

  [
    ".referral-success__label",
    "h2",
    ".referral-success__body",
    ".referral-success__number span",
    ".referral-success__number strong",
    ".referral-success__date",
    ".referral-success__proof",
    ".referral-success__next",
  ].forEach((selector) => drawTextElement(context, element.querySelector(selector), panelBounds));

  return { canvas, cssWidth, cssHeight };
}

function canvasToJpegBytes(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error("No se pudo convertir el comprobante a imagen."));
        return;
      }

      resolve(new Uint8Array(await blob.arrayBuffer()));
    }, "image/jpeg", 0.98);
  });
}

function formatPdfNumber(value) {
  return Number(value.toFixed(2)).toString();
}

function buildImagePdf({ jpegBytes, imageWidth, imageHeight, pageWidth, pageHeight }) {
  const content = asciiBytes(`q\n${formatPdfNumber(pageWidth)} 0 0 ${formatPdfNumber(pageHeight)} 0 0 cm\n/Im0 Do\nQ`);
  const objects = [
    asciiBytes("<< /Type /Catalog /Pages 2 0 R >>"),
    asciiBytes("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    asciiBytes(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${formatPdfNumber(pageWidth)} ${formatPdfNumber(pageHeight)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`),
    concatBytes([
      asciiBytes(`<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`),
      jpegBytes,
      asciiBytes("\nendstream"),
    ]),
    concatBytes([
      asciiBytes(`<< /Length ${content.length} >>\nstream\n`),
      content,
      asciiBytes("\nendstream"),
    ]),
    asciiBytes("<< /Title (Comprobante Recomenda y Gana) /Subject (Comprobante de participacion) >>"),
  ];

  const parts = [asciiBytes("%PDF-1.4\n%PDF\n")];
  const offsets = [0];
  let length = parts[0].length;

  objects.forEach((object, index) => {
    offsets.push(length);
    const wrapped = concatBytes([
      asciiBytes(`${index + 1} 0 obj\n`),
      object,
      asciiBytes("\nendobj\n"),
    ]);
    parts.push(wrapped);
    length += wrapped.length;
  });

  const xrefOffset = length;
  const xref = [
    `xref\n0 ${objects.length + 1}\n`,
    "0000000000 65535 f \n",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`),
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  ].join("");
  parts.push(asciiBytes(xref));

  return concatBytes(parts);
}

function safeFilePart(value) {
  return String(value || "participacion")
    .trim()
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "participacion";
}

export async function createReferralReceiptPdfBlob({ element } = {}) {
  if (!(element instanceof HTMLElement)) throw new TypeError("Se necesita el bloque de confirmación para generar el PDF.");

  const { canvas, cssWidth, cssHeight } = renderElementToCanvas(element);
  const jpegBytes = await canvasToJpegBytes(canvas);
  const pdfBytes = buildImagePdf({
    jpegBytes,
    imageWidth: canvas.width,
    imageHeight: canvas.height,
    pageWidth: cssWidth * PDF_POINTS_PER_CSS_PIXEL,
    pageHeight: cssHeight * PDF_POINTS_PER_CSS_PIXEL,
  });

  return new Blob([pdfBytes], { type: "application/pdf" });
}

export async function downloadReferralReceiptPdf({ element, participationNumber } = {}) {
  const blob = await createReferralReceiptPdfBlob({ element });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `comprobante-${safeFilePart(participationNumber)}.pdf`;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
