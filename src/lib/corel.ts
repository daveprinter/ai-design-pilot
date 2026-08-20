import { designToSvg, handoffPackage, download, type Design } from "./design";
import type { CorelSettings } from "./studio";

/**
 * CorelDRAW X7 bridge.
 *
 * A browser page cannot read the Windows registry, so detection works by
 * probing the optional Pilot Bridge helper (a tiny local service the designer
 * installs next to CorelDRAW) and, as a fallback, by protocol handoff.
 */
export async function detectCorel(bridgeUrl: string): Promise<{
  detected: "detected" | "not-found";
  version: string;
  message: string;
}> {
  try {
    const res = await fetch(`${bridgeUrl.replace(/\/$/, "")}/status`, {
      method: "GET",
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const data = (await res.json().catch(() => ({}))) as { version?: string };
      return {
        detected: "detected",
        version: data.version ?? "CorelDRAW X7 (17.x)",
        message: `CorelDRAW detected via Pilot Bridge — ${data.version ?? "X7 (17.x)"}`,
      };
    }
  } catch {
    /* bridge offline */
  }
  return {
    detected: "not-found",
    version: "—",
    message:
      "CorelDRAW was not detected. Install the Pilot Bridge helper on the machine running CorelDRAW X7, or use manual export and File ▸ Import.",
  };
}

export async function sendToCorel(
  design: Design,
  corel: CorelSettings,
): Promise<{ ok: boolean; message: string }> {
  if (!corel.linked) {
    return { ok: false, message: "Link to CorelDRAW is switched off in the Corel tab." };
  }

  const payload = {
    command: corel.openNewDocument ? "OpenNewDocument" : "ImportIntoActiveDocument",
    format: corel.importFormat.toUpperCase(),
    document: {
      name: design.name,
      widthMm: design.widthMm,
      heightMm: design.heightMm,
      bleedMm: design.bleedMm,
      colorMode: design.colorMode,
    },
    svg: designToSvg(design),
  };

  try {
    const res = await fetch(`${corel.bridgeUrl.replace(/\/$/, "")}/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      return {
        ok: true,
        message: `Sent “${design.name}” to CorelDRAW X7 as ${payload.format} using ${payload.command}.`,
      };
    }
    return { ok: false, message: `Bridge responded ${res.status}. File was not imported.` };
  } catch {
    // Offline fallback: drop a bridge package the helper (or the designer) can open.
    download(
      new Blob([handoffPackage(design, corel.importFormat)], { type: "application/json" }),
      `${design.name.replace(/[^\w-]+/g, "_").toLowerCase()}.corelbridge.json`,
    );
    return {
      ok: false,
      message:
        "Bridge offline — a .corelbridge package was downloaded instead. Open it with Pilot Bridge or import the SVG in CorelDRAW X7.",
    };
  }
}
