import { useState } from "react";
import { toast } from "sonner";
import { LayoutTemplate, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DesignCanvas } from "@/components/DesignCanvas";
import { Inspector } from "@/components/Inspector";
import { ExportPanel } from "@/components/ExportPanel";
import { useStudio } from "@/lib/studio";
import { TEMPLATES, templateToDesign } from "@/lib/templates";

export function TemplatesTab() {
  const { brand, setBrand, design, setDesign, selectedId, setSelectedId, prefs, checkpoint, log } = useStudio();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");

  const cats = ["All", ...Array.from(new Set(TEMPLATES.map((t) => t.category)))];
  const list = TEMPLATES.filter(
    (t) =>
      (cat === "All" || t.category === cat) &&
      t.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[280px_1fr_320px]">
      <aside className="panel flex max-h-[760px] flex-col p-3">
        <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold">
          <LayoutTemplate className="h-4 w-4 text-primary" /> Template Library
        </h3>
        <div className="relative mb-2">
          <Search className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates"
            className="h-8 pl-7 text-xs"
          />
        </div>
        <div className="mb-2 flex flex-wrap gap-1">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full border px-2 py-0.5 text-[10px] ${
                cat === c ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {list.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                checkpoint();
                setDesign(templateToDesign(t, brand));
                setSelectedId(null);
                log(`Opened template ${t.name}`);
                toast.success(`${t.name} loaded`);
              }}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface-2/50 p-2 text-left transition-colors hover:border-primary/60"
            >
              <span
                className="h-10 w-10 shrink-0 rounded"
                style={{ background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})` }}
              />
              <span>
                <span className="block text-xs font-semibold">{t.name}</span>
                <span className="block font-mono text-[10px] text-muted-foreground">
                  {t.widthMm}×{t.heightMm} mm · {t.category}
                </span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section className="space-y-4">
        <div className="panel p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold">{design.name}</h2>
              <p className="font-mono text-[11px] text-muted-foreground">
                {design.widthMm}×{design.heightMm} mm · bleed {design.bleedMm} mm · {design.colorMode} ·{" "}
                {design.objects.length} objects
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const t = TEMPLATES.find((x) => x.name === design.name);
                if (t) {
                  checkpoint();
                  setDesign(templateToDesign(t, brand));
                  toast.success("Brand details re-applied");
                }
              }}
            >
              Re-apply brand
            </Button>
          </div>
          <DesignCanvas
            design={design}
            showBleed={prefs.showBleed}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        <div className="panel p-4">
          <h3 className="mb-3 font-display text-sm font-bold">Brand details</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["company", "Company"],
                ["tagline", "Tagline"],
                ["person", "Name"],
                ["role", "Role"],
                ["phone", "Phone"],
                ["email", "Email"],
                ["website", "Website"],
                ["address", "Address"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                  {label}
                </span>
                <Input
                  value={brand[key]}
                  onChange={(e) => setBrand((b) => ({ ...b, [key]: e.target.value }))}
                  className="h-8 text-xs"
                />
              </label>
            ))}
            {(["primary", "secondary", "ink", "paper"] as const).map((key) => (
              <label key={key} className="block">
                <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                  {key}
                </span>
                <Input
                  type="color"
                  value={brand[key]}
                  onChange={(e) => setBrand((b) => ({ ...b, [key]: e.target.value }))}
                  className="h-8 cursor-pointer p-1"
                />
              </label>
            ))}
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <Inspector />
        <ExportPanel design={design} />
      </aside>
    </div>
  );
}
