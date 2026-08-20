/**
 * Pilot Studio design engine.
 * A design is a page in millimetres holding vector/text/image objects.
 * Everything (templates, car branding, mockups, exports, the object inspector,
 * the vehicle tiling tools and the AI actions) operates on this one model.
 */

export type ObjKind = "rect" | "ellipse" | "text" | "image" | "line";

export type DesignObject = {
  id: string;
  name: string;
  type: ObjKind;
  x: number; // mm
  y: number; // mm
  w: number; // mm
  h: number; // mm
  rotation: number; // deg
  fill: string; // hex
  stroke: string;
  strokeWidth: number; // mm
  opacity: number; // 0..1
  radius?: number; // mm, rect corner
  text?: string;
  fontSize?: number; // pt
  fontFamily?: string;
  fontWeight?: string;
  align?: "left" | "center" | "right";
  letterSpacing?: number;
  src?: string; // data url for images
  locked?: boolean;
  hidden?: boolean;
};

export type Design = {
  id: string;
  name: string;
  category: string;
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  colorMode: "CMYK" | "RGB";
  background: string;
  objects: DesignObject[];
};

export const MM_PER_INCH = 25.4;
export const PT_PER_MM = 72 / MM_PER_INCH;

export const uid = () => Math.random().toString(36).slice(2, 10);

export function makeObject(partial: Partial<DesignObject> & { type: ObjKind }): DesignObject {
  return {
    id: uid(),
    name: partial.name ?? partial.type,
    x: 0,
    y: 0,
    w: 40,
    h: 20,
    rotation: 0,
    fill: "#f2b134",
    stroke: "transparent",
    strokeWidth: 0,
    opacity: 1,
    fontSize: 18,
    fontFamily: "Space Grotesk, sans-serif",
    fontWeight: "700",
    align: "left",
    letterSpacing: 0,
    ...partial,
  };
}

/* ---------------------------------- render --------------------------------- */

const imageCache = new Map<string, HTMLImageElement>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached?.complete) return Promise.resolve(cached);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

export async function preloadDesignImages(design: Design) {
  await Promise.all(
    design.objects
      .filter((o) => o.type === "image" && o.src)
      .map((o) => loadImage(o.src!).catch(() => null)),
  );
}

export function drawDesign(
  ctx: CanvasRenderingContext2D,
  design: Design,
  pxPerMm: number,
  opts: { showBleed?: boolean } = {},
) {
  const W = design.widthMm * pxPerMm;
  const H = design.heightMm * pxPerMm;
  ctx.save();
  ctx.fillStyle = design.background;
  ctx.fillRect(0, 0, W, H);

  for (const o of design.objects) {
    if (o.hidden) continue;
    ctx.save();
    ctx.globalAlpha = o.opacity;
    const cx = (o.x + o.w / 2) * pxPerMm;
    const cy = (o.y + o.h / 2) * pxPerMm;
    ctx.translate(cx, cy);
    ctx.rotate((o.rotation * Math.PI) / 180);
    const w = o.w * pxPerMm;
    const h = o.h * pxPerMm;

    if (o.type === "rect") {
      const r = Math.min((o.radius ?? 0) * pxPerMm, w / 2, h / 2);
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, r);
      if (o.fill !== "transparent") {
        ctx.fillStyle = o.fill;
        ctx.fill();
      }
      if (o.strokeWidth > 0 && o.stroke !== "transparent") {
        ctx.lineWidth = o.strokeWidth * pxPerMm;
        ctx.strokeStyle = o.stroke;
        ctx.stroke();
      }
    } else if (o.type === "ellipse") {
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      if (o.fill !== "transparent") {
        ctx.fillStyle = o.fill;
        ctx.fill();
      }
      if (o.strokeWidth > 0 && o.stroke !== "transparent") {
        ctx.lineWidth = o.strokeWidth * pxPerMm;
        ctx.strokeStyle = o.stroke;
        ctx.stroke();
      }
    } else if (o.type === "line") {
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.lineTo(w / 2, 0);
      ctx.lineWidth = Math.max(o.strokeWidth, 0.2) * pxPerMm;
      ctx.strokeStyle = o.stroke === "transparent" ? o.fill : o.stroke;
      ctx.stroke();
    } else if (o.type === "text") {
      const sizePx = ((o.fontSize ?? 18) / PT_PER_MM) * pxPerMm;
      ctx.font = `${o.fontWeight ?? "700"} ${sizePx}px ${o.fontFamily ?? "sans-serif"}`;
      ctx.fillStyle = o.fill;
      ctx.textBaseline = "middle";
      ctx.textAlign = o.align ?? "left";
      const lines = (o.text ?? "").split("\n");
      const lineH = sizePx * 1.2;
      const startY = -((lines.length - 1) * lineH) / 2;
      const tx = o.align === "center" ? 0 : o.align === "right" ? w / 2 : -w / 2;
      lines.forEach((line, i) => ctx.fillText(line, tx, startY + i * lineH));
    } else if (o.type === "image" && o.src) {
      const img = imageCache.get(o.src);
      if (img?.complete) {
        const scale = Math.max(w / img.width, h / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.save();
        ctx.beginPath();
        ctx.rect(-w / 2, -h / 2, w, h);
        ctx.clip();
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      } else {
        ctx.fillStyle = "#33384a";
        ctx.fillRect(-w / 2, -h / 2, w, h);
      }
      if (o.strokeWidth > 0 && o.stroke !== "transparent") {
        ctx.lineWidth = o.strokeWidth * pxPerMm;
        ctx.strokeStyle = o.stroke;
        ctx.strokeRect(-w / 2, -h / 2, w, h);
      }
    }
    ctx.restore();
  }

  if (opts.showBleed && design.bleedMm > 0) {
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = "rgba(255,90,90,0.9)";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      design.bleedMm * pxPerMm,
      design.bleedMm * pxPerMm,
      W - design.bleedMm * 2 * pxPerMm,
      H - design.bleedMm * 2 * pxPerMm,
    );
  }
  ctx.restore();
}

export async function renderToCanvas(design: Design, dpi = 300): Promise<HTMLCanvasElement> {
  await preloadDesignImages(design);
  const pxPerMm = dpi / MM_PER_INCH;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(design.widthMm * pxPerMm);
  canvas.height = Math.round(design.heightMm * pxPerMm);
  const ctx = canvas.getContext("2d")!;
  drawDesign(ctx, design, pxPerMm);
  return canvas;
}

/* ---------------------------------- export --------------------------------- */

export type ExportFormat =
  | "png"
  | "jpg"
  | "svg"
  | "pdf"
  | "eps"
  | "cdr"
  | "indd"
  | "docx";

export const EXPORT_FORMATS: {
  id: ExportFormat;
  label: string;
  detail: string;
  color: string;
  native: boolean;
}[] = [
  { id: "png", label: "PNG", detail: "Raster · RGB · transparent-safe", color: "RGB", native: true },
  { id: "jpg", label: "JPG", detail: "Raster · RGB · smallest file", color: "RGB", native: true },
  { id: "pdf", label: "PDF", detail: "Print · press-ready page", color: "CMYK-intent", native: true },
  { id: "svg", label: "SVG", detail: "Vector · opens in CorelDRAW X7", color: "Vector", native: true },
  { id: "eps", label: "EPS", detail: "Vector handoff (via SVG payload)", color: "CMYK", native: false },
  { id: "cdr", label: "CDR (CorelDRAW X7)", detail: "Sent through the Corel bridge", color: "CMYK", native: false },
  { id: "indd", label: "IND / INDD", detail: "InDesign handoff package", color: "CMYK", native: false },
  { id: "docx", label: "DOCX", detail: "Office handoff package", color: "RGB", native: false },
];

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function designToSvg(design: Design): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const body = design.objects
    .filter((o) => !o.hidden)
    .map((o) => {
      const cx = o.x + o.w / 2;
      const cy = o.y + o.h / 2;
      const t = `transform="rotate(${o.rotation} ${cx} ${cy})" opacity="${o.opacity}"`;
      if (o.type === "rect")
        return `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx="${o.radius ?? 0}" fill="${o.fill}" stroke="${o.stroke}" stroke-width="${o.strokeWidth}" ${t}/>`;
      if (o.type === "ellipse")
        return `<ellipse cx="${cx}" cy="${cy}" rx="${o.w / 2}" ry="${o.h / 2}" fill="${o.fill}" stroke="${o.stroke}" stroke-width="${o.strokeWidth}" ${t}/>`;
      if (o.type === "line")
        return `<line x1="${o.x}" y1="${cy}" x2="${o.x + o.w}" y2="${cy}" stroke="${o.stroke === "transparent" ? o.fill : o.stroke}" stroke-width="${Math.max(o.strokeWidth, 0.2)}" ${t}/>`;
      if (o.type === "text") {
        const size = (o.fontSize ?? 18) / PT_PER_MM;
        const anchor = o.align === "center" ? "middle" : o.align === "right" ? "end" : "start";
        const tx = o.align === "center" ? cx : o.align === "right" ? o.x + o.w : o.x;
        const lines = (o.text ?? "").split("\n");
        return `<text x="${tx}" y="${cy}" fill="${o.fill}" font-family="${o.fontFamily ?? "sans-serif"}" font-weight="${o.fontWeight ?? 700}" font-size="${size}" text-anchor="${anchor}" ${t}>${lines
          .map(
            (l, i) =>
              `<tspan x="${tx}" dy="${i === 0 ? -((lines.length - 1) * size * 1.2) / 2 : size * 1.2}">${esc(l)}</tspan>`,
          )
          .join("")}</text>`;
      }
      if (o.type === "image" && o.src)
        return `<image x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" preserveAspectRatio="xMidYMid slice" href="${o.src}" ${t}/>`;
      return "";
    })
    .join("\n  ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${design.widthMm}mm" height="${design.heightMm}mm" viewBox="0 0 ${design.widthMm} ${design.heightMm}">
  <title>${esc(design.name)}</title>
  <rect width="${design.widthMm}" height="${design.heightMm}" fill="${design.background}"/>
  ${body}
</svg>`;
}

/** Minimal single-page PDF with the flattened design embedded as a JPEG. */
export async function designToPdfBlob(design: Design, dpi = 300): Promise<Blob> {
  const canvas = await renderToCanvas(design, dpi);
  const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.92);
  const b64 = jpegDataUrl.split(",")[1];
  const bin = atob(b64);
  const jpegBytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) jpegBytes[i] = bin.charCodeAt(i);

  const wPt = design.widthMm * PT_PER_MM;
  const hPt = design.heightMm * PT_PER_MM;
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (data: Uint8Array | string) => {
    const bytes = typeof data === "string" ? enc.encode(data) : data;
    chunks.push(bytes);
    length += bytes.length;
  };
  const startObj = () => offsets.push(length);

  push("%PDF-1.4\n");
  startObj();
  push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  startObj();
  push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  startObj();
  push(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wPt.toFixed(2)} ${hPt.toFixed(2)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`,
  );
  startObj();
  push(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
  );
  push(jpegBytes);
  push("\nendstream\nendobj\n");
  const content = `q\n${wPt.toFixed(2)} 0 0 ${hPt.toFixed(2)} 0 0 cm\n/Im0 Do\nQ\n`;
  startObj();
  push(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`);

  const xrefStart = length;
  let xref = `xref\n0 6\n0000000000 65535 f \n`;
  for (const off of offsets) xref += `${off.toString().padStart(10, "0")} 00000 n \n`;
  push(xref);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  return new Blob(chunks as BlobPart[], { type: "application/pdf" });
}

export function handoffPackage(design: Design, format: ExportFormat) {
  return JSON.stringify(
    {
      pilotStudio: "1.0",
      target: format.toUpperCase(),
      note:
        format === "cdr"
          ? "Open in CorelDRAW X7 via File > Import (svg payload below) or use the Corel bridge for automatic Open New Document."
          : "Import the embedded SVG payload into your target application.",
      document: {
        name: design.name,
        widthMm: design.widthMm,
        heightMm: design.heightMm,
        bleedMm: design.bleedMm,
        colorMode: design.colorMode,
        objects: design.objects.length,
      },
      svg: designToSvg(design),
    },
    null,
    2,
  );
}

export async function exportDesign(
  design: Design,
  format: ExportFormat,
  dpi = 300,
): Promise<string> {
  const base = design.name.replace(/[^\w-]+/g, "_").toLowerCase();
  if (format === "png" || format === "jpg") {
    const canvas = await renderToCanvas(design, dpi);
    const blob = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, format === "png" ? "image/png" : "image/jpeg", 0.92),
    );
    if (blob) download(blob, `${base}.${format}`);
    return `${base}.${format} · ${canvas.width}×${canvas.height}px @ ${dpi}DPI`;
  }
  if (format === "svg") {
    download(new Blob([designToSvg(design)], { type: "image/svg+xml" }), `${base}.svg`);
    return `${base}.svg · vector`;
  }
  if (format === "pdf") {
    download(await designToPdfBlob(design, dpi), `${base}.pdf`);
    return `${base}.pdf · ${design.widthMm}×${design.heightMm}mm @ ${dpi}DPI`;
  }
  // handoff formats
  const payload = handoffPackage(design, format);
  download(new Blob([payload], { type: "application/json" }), `${base}.${format}.pilotpkg.json`);
  download(new Blob([designToSvg(design)], { type: "image/svg+xml" }), `${base}.svg`);
  return `${base}.${format} handoff package + SVG payload`;
}

/* ------------------------- vehicle graphics utilities ---------------------- */

export function scaleDesign(design: Design, factor: number): Design {
  return {
    ...design,
    widthMm: +(design.widthMm * factor).toFixed(2),
    heightMm: +(design.heightMm * factor).toFixed(2),
    objects: design.objects.map((o) => ({
      ...o,
      x: +(o.x * factor).toFixed(2),
      y: +(o.y * factor).toFixed(2),
      w: +(o.w * factor).toFixed(2),
      h: +(o.h * factor).toFixed(2),
      fontSize: o.fontSize ? +(o.fontSize * factor).toFixed(2) : o.fontSize,
      strokeWidth: +(o.strokeWidth * factor).toFixed(3),
    })),
  };
}

export function mirrorDesign(design: Design): Design {
  return {
    ...design,
    objects: design.objects.map((o) => ({
      ...o,
      x: +(design.widthMm - o.x - o.w).toFixed(2),
      rotation: -o.rotation,
    })),
  };
}

export type Panel = {
  index: number;
  label: string;
  xMm: number;
  yMm: number;
  wMm: number;
  hMm: number;
};

export function tilePanels(
  design: Design,
  panelWidthMm: number,
  panelHeightMm: number,
  overlapMm: number,
): Panel[] {
  const stepX = Math.max(panelWidthMm - overlapMm, 1);
  const stepY = Math.max(panelHeightMm - overlapMm, 1);
  const cols = Math.max(1, Math.ceil((design.widthMm - overlapMm) / stepX));
  const rows = Math.max(1, Math.ceil((design.heightMm - overlapMm) / stepY));
  const panels: Panel[] = [];
  let i = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      panels.push({
        index: i,
        label: `P${String(i).padStart(2, "0")} · R${r + 1}C${c + 1}`,
        xMm: +(c * stepX).toFixed(1),
        yMm: +(r * stepY).toFixed(1),
        wMm: +Math.min(panelWidthMm, design.widthMm - c * stepX).toFixed(1),
        hMm: +Math.min(panelHeightMm, design.heightMm - r * stepY).toFixed(1),
      });
      i++;
    }
  }
  return panels;
}

export function installationGuide(design: Design, panels: Panel[], overlapMm: number) {
  const lines = [
    `INSTALLATION GUIDE — ${design.name}`,
    `Finished size: ${design.widthMm} × ${design.heightMm} mm`,
    `Panels: ${panels.length}  ·  Overlap: ${overlapMm} mm  ·  Alignment marks: crosshair at every panel corner`,
    "",
    "1. Clean and degrease the substrate; allow to dry fully.",
    "2. Dry-fit panels in order, hinge with masking tape along the top edge.",
    "3. Apply from the centre outwards using a felt-edged squeegee at 45°.",
    "4. Overlap each following panel onto the printed overlap band, matching the crosshair marks.",
    "5. Post-heat all curves and recesses to 90°C and re-squeegee edges.",
    "",
    "PANEL ORDER",
    ...panels.map(
      (p) =>
        `  ${p.label}  →  x ${p.xMm}mm  y ${p.yMm}mm  ·  ${p.wMm} × ${p.hMm} mm`,
    ),
  ];
  return lines.join("\n");
}

/* --------------------------------- doctor ---------------------------------- */

export type DoctorIssue = { level: "error" | "warn" | "info"; message: string; fixable: boolean };

export function runDesignDoctor(design: Design): DoctorIssue[] {
  const issues: DoctorIssue[] = [];
  const outside = design.objects.filter(
    (o) =>
      o.x < 0 || o.y < 0 || o.x + o.w > design.widthMm || o.y + o.h > design.heightMm,
  );
  if (outside.length)
    issues.push({
      level: "warn",
      message: `${outside.length} object(s) outside the page area`,
      fixable: true,
    });
  if (design.bleedMm < 3)
    issues.push({ level: "warn", message: "Bleed is below the 3 mm print standard", fixable: true });
  if (design.colorMode !== "CMYK")
    issues.push({ level: "warn", message: "Document is RGB — press work should be CMYK", fixable: true });
  const thin = design.objects.filter((o) => o.strokeWidth > 0 && o.strokeWidth < 0.2);
  if (thin.length)
    issues.push({ level: "warn", message: `${thin.length} hairline outline(s) below 0.2 mm`, fixable: true });
  const sizes = new Set(design.objects.filter((o) => o.type === "text").map((o) => o.fontSize));
  if (sizes.size > 4)
    issues.push({ level: "info", message: `${sizes.size} different font sizes — hierarchy may be inconsistent`, fixable: false });
  const tiny = design.objects.filter((o) => o.w < 1 || o.h < 1);
  if (tiny.length) issues.push({ level: "warn", message: `${tiny.length} stray/tiny object(s)`, fixable: true });
  if (!issues.length)
    issues.push({ level: "info", message: "No problems found — document is press-ready", fixable: false });
  return issues;
}

export function autoFix(design: Design): Design {
  const fixed: Design = {
    ...design,
    colorMode: "CMYK",
    bleedMm: Math.max(design.bleedMm, 3),
    objects: design.objects
      .filter((o) => o.w >= 1 && o.h >= 1)
      .map((o) => ({
        ...o,
        strokeWidth: o.strokeWidth > 0 ? Math.max(o.strokeWidth, 0.25) : 0,
        x: Math.min(Math.max(o.x, 0), Math.max(design.widthMm - o.w, 0)),
        y: Math.min(Math.max(o.y, 0), Math.max(design.heightMm - o.h, 0)),
      })),
  };
  return fixed;
}
