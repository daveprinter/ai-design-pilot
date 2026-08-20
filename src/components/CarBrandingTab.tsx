import { useState } from "react";
import { toast } from "sonner";
import { Car, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DesignCanvas } from "@/components/DesignCanvas";
import { Inspector } from "@/components/Inspector";
import { ExportPanel } from "@/components/ExportPanel";
import { useStudio } from "@/lib/studio";
import { CAR_TEMPLATES, templateToDesign } from "@/lib/templates";
import {
  installationGuide,
  makeObject,
  mirrorDesign,
  scaleDesign,
  tilePanels,
  download,
} from "@/lib/design";
import { fileToDataUrl } from "@/lib/ai";

export function CarBrandingTab() {
  const { brand, design, setDesign, selectedId, setSelectedId, prefs, checkpoint, log } = useStudio();
  const [panelW, setPanelW] = useState(1370);
  const [panelH, setPanelH] = useState(1500);
  const [overlap, setOverlap] = useState(25);
  const [scale, setScale] = useState(1);

  const panels = tilePanels(design, panelW, panelH, overlap);

  const upload = async (files: FileList | null, asBackground: boolean) => {
    const file = files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    checkpoint();
    setDesign((d) => ({
      ...d,
      objects: asBackground
        ? [
            makeObject({
              type: "image",
              name: "Vehicle photo",
              src: dataUrl,
              x: 0,
              y: 0,
              w: d.widthMm,
              h: d.heightMm,
            }),
            ...d.objects,
          ]
        : [
            ...d.objects,
            makeObject({
              type: "image",
              name: file.name.slice(0, 20),
              src: dataUrl,
              x: d.widthMm * 0.15,
              y: d.heightMm * 0.15,
              w: d.widthMm * 0.35,
              h: d.heightMm * 0.35,
            }),
          ],
    }));
    log(`Uploaded ${file.name} to vehicle layout`);
    toast.success("Artwork placed");
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[280px_1fr_320px]">
      <aside className="panel max-h-[760px] overflow-y-auto p-3">
        <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold">
          <Car className="h-4 w-4 text-primary" /> Vehicle Templates
        </h3>
        <div className="space-y-2">
          {CAR_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                checkpoint();
                setDesign(templateToDesign(t, brand));
                setSelectedId(null);
                toast.success(`${t.name} loaded`);
              }}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface-2/50 p-2 text-left transition-colors hover:border-primary/60"
            >
              <span
                className="h-10 w-14 shrink-0 rounded"
                style={{ background: `linear-gradient(120deg, ${t.swatch[0]}, ${t.swatch[1]})` }}
              />
              <span>
                <span className="block text-xs font-semibold">{t.name}</span>
                <span className="block font-mono text-[10px] text-muted-foreground">
                  {t.widthMm}×{t.heightMm} mm
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-xs hover:border-primary/60">
            <Upload className="h-4 w-4" /> Upload vehicle photo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files, true)} />
          </label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-xs hover:border-primary/60">
            <Upload className="h-4 w-4" /> Upload artwork / logo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files, false)} />
          </label>
        </div>
      </aside>

      <section className="space-y-4">
        <div className="panel p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold">{design.name}</h2>
              <p className="font-mono text-[11px] text-muted-foreground">
                {(design.widthMm / 1000).toFixed(2)} × {(design.heightMm / 1000).toFixed(2)} m · {panels.length} print
                panels
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  checkpoint();
                  setDesign(mirrorDesign(design));
                  toast.success("Artwork mirrored (near-side ⇄ off-side)");
                }}
              >
                Mirror
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  checkpoint();
                  setDesign(scaleDesign(design, scale));
                  toast.success(`Scaled ×${scale}`);
                }}
              >
                Scale ×{scale}
              </Button>
              <Input
                type="number"
                step={0.1}
                value={scale}
                onChange={(e) => setScale(+e.target.value || 1)}
                className="h-8 w-20 text-xs"
              />
            </div>
          </div>
          <DesignCanvas
            design={design}
            showBleed={prefs.showBleed}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        <div className="panel p-4">
          <h3 className="mb-3 font-display text-sm font-bold">Vehicle Graphics Assistant — tiling &amp; panels</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="block">
              <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                Panel width
              </span>
              <Input type="number" value={panelW} onChange={(e) => setPanelW(+e.target.value)} className="h-8 text-xs" />
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                Panel height
              </span>
              <Input type="number" value={panelH} onChange={(e) => setPanelH(+e.target.value)} className="h-8 text-xs" />
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                Overlap
              </span>
              <Input type="number" value={overlap} onChange={(e) => setOverlap(+e.target.value)} className="h-8 text-xs" />
            </label>
          </div>

          <div className="mt-3 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {panels.map((p) => (
              <div key={p.index} className="rounded-md border border-border bg-surface-2/50 px-2 py-1 font-mono text-[10px]">
                <span className="text-primary">{p.label}</span> · {p.wMm}×{p.hMm} mm @ {p.xMm},{p.yMm}
                <span className="ml-1 text-muted-foreground">✛ marks</span>
              </div>
            ))}
          </div>

          <Button
            size="sm"
            className="mt-3"
            onClick={() => {
              download(
                new Blob([installationGuide(design, panels, overlap)], { type: "text/plain" }),
                `${design.name.replace(/[^\w-]+/g, "_").toLowerCase()}_installation_guide.txt`,
              );
              log("Generated installation guide", "export");
              toast.success("Installation guide downloaded");
            }}
          >
            Generate installation guide
          </Button>
        </div>
      </section>

      <aside className="space-y-4">
        <Inspector />
        <ExportPanel design={design} />
      </aside>
    </div>
  );
}
