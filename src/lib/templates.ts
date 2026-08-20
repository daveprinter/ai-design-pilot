import { makeObject, uid, type Design, type DesignObject } from "./design";

export type TemplateDef = {
  id: string;
  name: string;
  category: string;
  widthMm: number;
  heightMm: number;
  swatch: [string, string];
  build: (brand: BrandInput) => DesignObject[];
};

export type BrandInput = {
  company: string;
  tagline: string;
  person: string;
  role: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  primary: string;
  secondary: string;
  ink: string;
  paper: string;
};

export const DEFAULT_BRAND: BrandInput = {
  company: "PILOT GRAPHICS",
  tagline: "Design · Branding · Large Format",
  person: "Alex Mwangi",
  role: "Creative Director",
  phone: "+254 700 000 000",
  email: "hello@pilotgraphics.co",
  website: "pilotgraphics.co",
  address: "Riverside Drive, Nairobi",
  primary: "#f2b134",
  secondary: "#1f2430",
  ink: "#12151d",
  paper: "#ffffff",
};

const T = (
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fontSize: number,
  fill: string,
  extra: Partial<DesignObject> = {},
) => makeObject({ type: "text", name: text.slice(0, 18) || "Text", text, x, y, w, h, fontSize, fill, ...extra });

const R = (x: number, y: number, w: number, h: number, fill: string, extra: Partial<DesignObject> = {}) =>
  makeObject({ type: "rect", name: "Shape", x, y, w, h, fill, ...extra });

export const TEMPLATES: TemplateDef[] = [
  {
    id: "business-card",
    name: "Business Card",
    category: "Branding",
    widthMm: 90,
    heightMm: 55,
    swatch: ["#f2b134", "#1f2430"],
    build: (b) => [
      R(0, 0, 90, 55, b.paper, { name: "Card" }),
      R(0, 0, 6, 55, b.primary, { name: "Accent bar" }),
      T(b.company, 12, 10, 70, 8, 13, b.ink, { name: "Company" }),
      T(b.tagline, 12, 18, 70, 5, 7, b.secondary, { name: "Tagline", fontWeight: "400" }),
      T(b.person, 12, 32, 70, 6, 10, b.ink, { name: "Name" }),
      T(b.role, 12, 38, 70, 4, 7, b.primary, { name: "Role", fontWeight: "500" }),
      T(`${b.phone}\n${b.email}\n${b.website}`, 12, 44, 70, 9, 6, b.secondary, {
        name: "Contact",
        fontWeight: "400",
      }),
    ],
  },
  {
    id: "letterhead",
    name: "Letterhead A4",
    category: "Branding",
    widthMm: 210,
    heightMm: 297,
    swatch: ["#1f2430", "#f2b134"],
    build: (b) => [
      R(0, 0, 210, 297, b.paper),
      R(0, 0, 210, 28, b.secondary, { name: "Header band" }),
      R(0, 28, 210, 2, b.primary, { name: "Rule" }),
      T(b.company, 15, 12, 120, 8, 16, b.paper, { name: "Company" }),
      T(b.tagline, 15, 20, 120, 5, 8, b.primary, { name: "Tagline", fontWeight: "400" }),
      T(`${b.phone}  ·  ${b.email}  ·  ${b.website}`, 15, 285, 180, 6, 8, b.secondary, {
        name: "Footer",
        fontWeight: "400",
      }),
      R(0, 292, 210, 5, b.primary, { name: "Footer bar" }),
    ],
  },
  {
    id: "logo-lockup",
    name: "Logo Lockup Sheet",
    category: "Branding",
    widthMm: 210,
    heightMm: 210,
    swatch: ["#f2b134", "#12151d"],
    build: (b) => [
      R(0, 0, 210, 210, b.ink),
      makeObject({ type: "ellipse", name: "Mark", x: 70, y: 40, w: 70, h: 70, fill: b.primary }),
      T(b.company.slice(0, 2), 70, 62, 70, 26, 60, b.ink, { name: "Monogram", align: "center" }),
      T(b.company, 20, 130, 170, 14, 26, b.paper, { name: "Wordmark", align: "center" }),
      T(b.tagline, 20, 148, 170, 8, 10, b.primary, { name: "Tagline", align: "center", fontWeight: "400" }),
      R(20, 175, 40, 12, b.primary, { name: "Swatch 1" }),
      R(65, 175, 40, 12, b.secondary, { name: "Swatch 2" }),
      R(110, 175, 40, 12, b.paper, { name: "Swatch 3" }),
    ],
  },
  {
    id: "flyer-a5",
    name: "Flyer A5",
    category: "Print",
    widthMm: 148,
    heightMm: 210,
    swatch: ["#f2b134", "#ffffff"],
    build: (b) => [
      R(0, 0, 148, 210, b.paper),
      R(0, 0, 148, 90, b.primary, { name: "Hero band" }),
      T("GRAND\nOPENING", 12, 22, 124, 40, 34, b.ink, { name: "Headline" }),
      T(b.company, 12, 100, 124, 10, 16, b.ink, { name: "Company" }),
      T(b.tagline, 12, 112, 124, 8, 9, b.secondary, { name: "Body", fontWeight: "400" }),
      R(12, 130, 124, 0.5, b.secondary, { name: "Rule" }),
      T(`${b.phone}\n${b.email}\n${b.address}`, 12, 140, 124, 20, 9, b.ink, {
        name: "Contact",
        fontWeight: "400",
      }),
      R(12, 180, 60, 16, b.secondary, { name: "CTA", radius: 3 }),
      T("BOOK NOW", 12, 185, 60, 8, 10, b.paper, { name: "CTA text", align: "center" }),
    ],
  },
  {
    id: "poster-a3",
    name: "Poster A3",
    category: "Print",
    widthMm: 297,
    heightMm: 420,
    swatch: ["#12151d", "#f2b134"],
    build: (b) => [
      R(0, 0, 297, 420, b.ink),
      R(20, 20, 257, 200, b.primary, { name: "Image plate" }),
      T("EVENT\nNIGHT", 30, 260, 240, 70, 60, b.paper, { name: "Headline" }),
      T(b.company, 30, 350, 240, 12, 18, b.primary, { name: "Company" }),
      T(`${b.address}  ·  ${b.phone}`, 30, 370, 240, 10, 11, b.paper, { name: "Details", fontWeight: "400" }),
    ],
  },
  {
    id: "certificate",
    name: "Certificate A4 Landscape",
    category: "Documents",
    widthMm: 297,
    heightMm: 210,
    swatch: ["#ffffff", "#f2b134"],
    build: (b) => [
      R(0, 0, 297, 210, b.paper),
      R(10, 10, 277, 190, "transparent", { name: "Border", stroke: b.primary, strokeWidth: 2 }),
      R(16, 16, 265, 178, "transparent", { name: "Inner border", stroke: b.secondary, strokeWidth: 0.4 }),
      T("CERTIFICATE OF ACHIEVEMENT", 30, 40, 237, 12, 20, b.secondary, { name: "Title", align: "center" }),
      T("This is presented to", 30, 62, 237, 8, 10, b.secondary, { name: "Lead", align: "center", fontWeight: "400" }),
      T(b.person, 30, 82, 237, 16, 30, b.primary, { name: "Recipient", align: "center" }),
      T("for outstanding performance and dedication", 30, 105, 237, 8, 10, b.secondary, {
        name: "Body",
        align: "center",
        fontWeight: "400",
      }),
      R(45, 160, 70, 0.4, b.secondary, { name: "Sign line 1" }),
      R(182, 160, 70, 0.4, b.secondary, { name: "Sign line 2" }),
      T("Date", 45, 166, 70, 6, 8, b.secondary, { name: "Date label", align: "center", fontWeight: "400" }),
      T("Signature", 182, 166, 70, 6, 8, b.secondary, { name: "Sign label", align: "center", fontWeight: "400" }),
    ],
  },
  {
    id: "invoice",
    name: "Invoice A4",
    category: "Documents",
    widthMm: 210,
    heightMm: 297,
    swatch: ["#ffffff", "#1f2430"],
    build: (b) => [
      R(0, 0, 210, 297, b.paper),
      T("INVOICE", 15, 20, 90, 12, 24, b.ink, { name: "Title" }),
      T(b.company, 120, 18, 75, 8, 12, b.ink, { name: "Company", align: "right" }),
      T(`${b.address}\n${b.phone}\n${b.email}`, 120, 27, 75, 14, 8, b.secondary, {
        name: "From",
        align: "right",
        fontWeight: "400",
      }),
      R(15, 55, 180, 10, b.secondary, { name: "Table head" }),
      T("DESCRIPTION            QTY      RATE      AMOUNT", 18, 58, 174, 6, 8, b.paper, { name: "Head text" }),
      R(15, 70, 180, 0.3, b.secondary, { name: "Row rule 1" }),
      R(15, 82, 180, 0.3, b.secondary, { name: "Row rule 2" }),
      R(15, 94, 180, 0.3, b.secondary, { name: "Row rule 3" }),
      T("TOTAL", 120, 110, 40, 8, 12, b.ink, { name: "Total label", align: "right" }),
      T("0.00", 165, 110, 30, 8, 12, b.primary, { name: "Total value", align: "right" }),
    ],
  },
  {
    id: "id-card",
    name: "ID Card",
    category: "Documents",
    widthMm: 54,
    heightMm: 86,
    swatch: ["#1f2430", "#f2b134"],
    build: (b) => [
      R(0, 0, 54, 86, b.paper),
      R(0, 0, 54, 20, b.secondary, { name: "Header" }),
      T(b.company, 4, 8, 46, 6, 8, b.paper, { name: "Company", align: "center" }),
      R(14, 24, 26, 30, b.primary, { name: "Photo frame" }),
      T(b.person, 4, 60, 46, 6, 9, b.ink, { name: "Name", align: "center" }),
      T(b.role, 4, 67, 46, 5, 6, b.secondary, { name: "Role", align: "center", fontWeight: "400" }),
      R(0, 78, 54, 8, b.primary, { name: "Footer bar" }),
    ],
  },
  {
    id: "roll-up",
    name: "Roll-up Banner 850×2000",
    category: "Large Format",
    widthMm: 850,
    heightMm: 2000,
    swatch: ["#f2b134", "#12151d"],
    build: (b) => [
      R(0, 0, 850, 2000, b.ink),
      R(0, 0, 850, 420, b.primary, { name: "Top band" }),
      T(b.company, 60, 160, 730, 60, 90, b.ink, { name: "Company" }),
      T(b.tagline, 60, 480, 730, 40, 40, b.paper, { name: "Tagline", fontWeight: "400" }),
      R(60, 560, 730, 900, "#2a2f3c", { name: "Image plate" }),
      T(`${b.phone}\n${b.email}\n${b.website}`, 60, 1550, 730, 160, 44, b.primary, {
        name: "Contact",
        fontWeight: "400",
      }),
    ],
  },
  {
    id: "shop-banner",
    name: "Shop Banner 3×1 m",
    category: "Large Format",
    widthMm: 3000,
    heightMm: 1000,
    swatch: ["#12151d", "#f2b134"],
    build: (b) => [
      R(0, 0, 3000, 1000, b.secondary),
      R(0, 0, 3000, 120, b.primary, { name: "Top rail" }),
      R(0, 880, 3000, 120, b.primary, { name: "Bottom rail" }),
      T(b.company, 120, 330, 2000, 150, 190, b.paper, { name: "Company" }),
      T(b.tagline, 120, 520, 2000, 90, 70, b.primary, { name: "Tagline", fontWeight: "400" }),
      T(`${b.phone}  ·  ${b.website}`, 120, 660, 2000, 80, 60, b.paper, { name: "Contact", fontWeight: "400" }),
    ],
  },
  {
    id: "social-post",
    name: "Social Post 1080²",
    category: "Social",
    widthMm: 200,
    heightMm: 200,
    swatch: ["#f2b134", "#12151d"],
    build: (b) => [
      R(0, 0, 200, 200, b.ink),
      makeObject({ type: "ellipse", name: "Blob", x: 110, y: -30, w: 160, h: 160, fill: b.primary, opacity: 0.9 }),
      T("NEW\nDROP", 16, 70, 120, 50, 40, b.paper, { name: "Headline" }),
      T(b.company, 16, 165, 120, 10, 12, b.primary, { name: "Company" }),
      T(b.website, 16, 178, 120, 8, 9, b.paper, { name: "Handle", fontWeight: "400" }),
    ],
  },
  {
    id: "sticker",
    name: "Sticker / Label 80mm",
    category: "Print",
    widthMm: 80,
    heightMm: 80,
    swatch: ["#f2b134", "#ffffff"],
    build: (b) => [
      makeObject({ type: "ellipse", name: "Die-cut", x: 0, y: 0, w: 80, h: 80, fill: b.primary }),
      T(b.company, 8, 32, 64, 10, 13, b.ink, { name: "Company", align: "center" }),
      T(b.website, 8, 46, 64, 6, 7, b.ink, { name: "Web", align: "center", fontWeight: "400" }),
    ],
  },
  {
    id: "menu",
    name: "Menu A4",
    category: "Print",
    widthMm: 210,
    heightMm: 297,
    swatch: ["#12151d", "#f2b134"],
    build: (b) => [
      R(0, 0, 210, 297, b.ink),
      T("MENU", 15, 22, 180, 16, 34, b.primary, { name: "Title", align: "center" }),
      T(b.company, 15, 44, 180, 8, 11, b.paper, { name: "Company", align: "center", fontWeight: "400" }),
      R(15, 58, 180, 0.4, b.primary, { name: "Rule" }),
      T("Starters\nMains\nGrill\nDesserts\nDrinks", 20, 70, 170, 60, 14, b.paper, { name: "Sections" }),
      T(`${b.phone} · ${b.address}`, 15, 275, 180, 8, 8, b.primary, { name: "Footer", align: "center", fontWeight: "400" }),
    ],
  },
  {
    id: "brochure",
    name: "Tri-fold Brochure A4",
    category: "Print",
    widthMm: 297,
    heightMm: 210,
    swatch: ["#ffffff", "#f2b134"],
    build: (b) => [
      R(0, 0, 297, 210, b.paper),
      R(99, 0, 0.3, 210, b.secondary, { name: "Fold 1" }),
      R(198, 0, 0.3, 210, b.secondary, { name: "Fold 2" }),
      R(198, 0, 99, 80, b.primary, { name: "Cover band" }),
      T(b.company, 206, 30, 83, 10, 14, b.ink, { name: "Company" }),
      T(b.tagline, 206, 44, 83, 8, 8, b.secondary, { name: "Tagline", fontWeight: "400" }),
      T("About us", 8, 20, 83, 8, 12, b.ink, { name: "Panel 1 title" }),
      T("Services", 107, 20, 83, 8, 12, b.ink, { name: "Panel 2 title" }),
    ],
  },
  {
    id: "invitation",
    name: "Invitation Card",
    category: "Print",
    widthMm: 148,
    heightMm: 105,
    swatch: ["#1f2430", "#f2b134"],
    build: (b) => [
      R(0, 0, 148, 105, b.secondary),
      R(8, 8, 132, 89, "transparent", { name: "Border", stroke: b.primary, strokeWidth: 0.6 }),
      T("YOU'RE INVITED", 14, 34, 120, 10, 16, b.primary, { name: "Title", align: "center" }),
      T(b.company, 14, 52, 120, 8, 11, b.paper, { name: "Host", align: "center", fontWeight: "400" }),
      T(b.address, 14, 66, 120, 8, 8, b.paper, { name: "Venue", align: "center", fontWeight: "400" }),
    ],
  },
  {
    id: "receipt",
    name: "Receipt 80mm",
    category: "Documents",
    widthMm: 80,
    heightMm: 200,
    swatch: ["#ffffff", "#1f2430"],
    build: (b) => [
      R(0, 0, 80, 200, b.paper),
      T(b.company, 6, 12, 68, 8, 11, b.ink, { name: "Company", align: "center" }),
      T(`${b.phone}\n${b.address}`, 6, 22, 68, 12, 6, b.secondary, { name: "Details", align: "center", fontWeight: "400" }),
      R(6, 40, 68, 0.3, b.secondary, { name: "Rule" }),
      T("ITEM              QTY    AMOUNT", 6, 46, 68, 6, 6, b.ink, { name: "Head" }),
      R(6, 150, 68, 0.3, b.secondary, { name: "Rule 2" }),
      T("TOTAL", 6, 158, 34, 6, 9, b.ink, { name: "Total" }),
      T("0.00", 40, 158, 34, 6, 9, b.ink, { name: "Amount", align: "right" }),
    ],
  },
];

export const CAR_TEMPLATES: TemplateDef[] = [
  {
    id: "van-side",
    name: "Van Side Wrap 4800×1900",
    category: "Vehicle",
    widthMm: 4800,
    heightMm: 1900,
    swatch: ["#f2b134", "#12151d"],
    build: (b) => [
      R(0, 0, 4800, 1900, b.secondary),
      R(0, 1200, 4800, 700, b.primary, { name: "Sweep" }),
      T(b.company, 240, 380, 3200, 260, 320, b.paper, { name: "Company" }),
      T(b.tagline, 240, 720, 3200, 140, 130, b.primary, { name: "Tagline", fontWeight: "400" }),
      T(`${b.phone}   ${b.website}`, 240, 1400, 3600, 160, 150, b.ink, { name: "Contact" }),
    ],
  },
  {
    id: "pickup-door",
    name: "Pickup Door Decal 900×600",
    category: "Vehicle",
    widthMm: 900,
    heightMm: 600,
    swatch: ["#12151d", "#f2b134"],
    build: (b) => [
      R(0, 0, 900, 600, "transparent"),
      T(b.company, 40, 140, 820, 90, 90, b.ink, { name: "Company" }),
      R(40, 250, 820, 8, b.primary, { name: "Rule" }),
      T(`${b.phone}\n${b.website}`, 40, 300, 820, 140, 60, b.secondary, { name: "Contact", fontWeight: "400" }),
    ],
  },
  {
    id: "rear-window",
    name: "Rear Window Perf 1300×700",
    category: "Vehicle",
    widthMm: 1300,
    heightMm: 700,
    swatch: ["#1f2430", "#ffffff"],
    build: (b) => [
      R(0, 0, 1300, 700, b.ink),
      T(b.company, 60, 240, 1180, 120, 130, b.primary, { name: "Company", align: "center" }),
      T(b.website, 60, 400, 1180, 80, 70, b.paper, { name: "Web", align: "center", fontWeight: "400" }),
    ],
  },
  {
    id: "bus-full",
    name: "Bus Full Wrap 12000×3000",
    category: "Vehicle",
    widthMm: 12000,
    heightMm: 3000,
    swatch: ["#f2b134", "#1f2430"],
    build: (b) => [
      R(0, 0, 12000, 3000, b.secondary),
      R(0, 1800, 12000, 1200, b.primary, { name: "Lower sweep" }),
      T(b.company, 500, 600, 8000, 500, 620, b.paper, { name: "Company" }),
      T(b.tagline, 500, 1250, 8000, 300, 260, b.primary, { name: "Tagline", fontWeight: "400" }),
      T(`${b.phone}  ·  ${b.website}`, 500, 2200, 9000, 300, 240, b.ink, { name: "Contact" }),
    ],
  },
  {
    id: "taxi-strip",
    name: "Taxi Door Strip 1200×300",
    category: "Vehicle",
    widthMm: 1200,
    heightMm: 300,
    swatch: ["#f2b134", "#12151d"],
    build: (b) => [
      R(0, 0, 1200, 300, b.primary),
      T(`${b.company}  ·  ${b.phone}`, 40, 110, 1120, 90, 90, b.ink, { name: "Strip text" }),
    ],
  },
  {
    id: "truck-curtain",
    name: "Truck Curtain 7200×2600",
    category: "Vehicle",
    widthMm: 7200,
    heightMm: 2600,
    swatch: ["#12151d", "#f2b134"],
    build: (b) => [
      R(0, 0, 7200, 2600, b.ink),
      R(300, 300, 6600, 2000, "transparent", { name: "Safe area", stroke: b.primary, strokeWidth: 12 }),
      T(b.company, 500, 900, 5000, 400, 480, b.paper, { name: "Company" }),
      T(b.tagline, 500, 1450, 5000, 240, 200, b.primary, { name: "Tagline", fontWeight: "400" }),
    ],
  },
];

export function templateToDesign(t: TemplateDef, brand: BrandInput): Design {
  return {
    id: uid(),
    name: t.name,
    category: t.category,
    widthMm: t.widthMm,
    heightMm: t.heightMm,
    bleedMm: t.widthMm > 1000 ? 10 : 3,
    colorMode: "CMYK",
    background: brand.paper,
    objects: t.build(brand),
  };
}

export const MOCKUPS = [
  { id: "tshirt", label: "T-shirt", frame: { x: 30, y: 26, w: 40, h: 34 }, base: "#2b3040" },
  { id: "mug", label: "Mug", frame: { x: 26, y: 34, w: 40, h: 30 }, base: "#e9e9ee" },
  { id: "business-card", label: "Business card", frame: { x: 14, y: 26, w: 72, h: 44 }, base: "#d8d9de" },
  { id: "billboard", label: "Billboard", frame: { x: 8, y: 14, w: 84, h: 46 }, base: "#3a4053" },
  { id: "signboard", label: "Signboard", frame: { x: 12, y: 22, w: 76, h: 40 }, base: "#22273a" },
  { id: "phone", label: "Phone", frame: { x: 34, y: 12, w: 32, h: 68 }, base: "#15181f" },
  { id: "laptop", label: "Laptop", frame: { x: 16, y: 16, w: 68, h: 44 }, base: "#1b1f2b" },
  { id: "packaging", label: "Packaging", frame: { x: 24, y: 22, w: 52, h: 52 }, base: "#c9b697" },
  { id: "bottle", label: "Bottle", frame: { x: 38, y: 30, w: 24, h: 40 }, base: "#20463f" },
  { id: "vehicle", label: "Vehicle", frame: { x: 18, y: 34, w: 64, h: 28 }, base: "#2c3140" },
  { id: "shop-sign", label: "Shop sign", frame: { x: 10, y: 18, w: 80, h: 26 }, base: "#1a1d27" },
  { id: "banner", label: "Banner", frame: { x: 30, y: 8, w: 40, h: 80 }, base: "#242938" },
] as const;

export const ASSET_LIBRARY = [
  { category: "Logos", items: ["Monogram circle", "Wordmark bar", "Shield badge", "Ribbon crest"] },
  { category: "Icons", items: ["Phone", "Mail", "Pin", "Globe", "WhatsApp", "Clock"] },
  { category: "Frames", items: ["Thin rule", "Double border", "Corner ticks", "Art-deco"] },
  { category: "Backgrounds", items: ["Carbon", "Diagonal sweep", "Halftone", "Gradient mesh"] },
  { category: "Shapes", items: ["Chevron", "Blob", "Arrow band", "Hex grid"] },
  { category: "Color palettes", items: ["Gold & Ink", "Corporate Blue", "Monochrome", "Luxury Emerald"] },
  { category: "Patterns", items: ["Stripes 45°", "Dots 3mm", "Weave", "Camo"] },
  { category: "Borders", items: ["Cut line", "Safe area", "Bleed guide", "Panel marks"] },
];
