import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudio } from "@/lib/studio";
import { ASSET_LIBRARY, MOCKUPS } from "@/lib/templates";
import { renderToCanvas, runDesignDoctor, autoFix } from "@/lib/design";

export function MockupTab() {
  const { design, setDesign, checkpoint, log } = useStudio();
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mockup, setMockup] = useState<(typeof MOCKUPS)[number]>(MOCKUPS[0]);
  const issues = runDesignDoctor(design);

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    renderToCanvas(design, 96)
      .then((c) => {
        if (!cancelled) setPreview(c.toDataURL("image/png"));
      })
      .finally(() => !cancelled && setBusy(false));
    return () => {
      cancelled = true;
    };
  }, [design]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <section className="panel p-4">
        <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold">
          <Layers className="h-4 w-4 text-primary" /> Mockup Generator
        </h3>
        <div className="mb-4 flex flex-wrap gap-2">
          {MOCKUPS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMockup(m)}
              className={`rounded-full border px-3 py-1 text-xs ${
                mockup.id === m.id ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div
          className="relative mx-auto aspect-[4/3] w-full max-w-2xl overflow-hidden rounded-xl border border-border"
          style={{ background: `radial-gradient(circle at 30% 20%, ${mockup.base}, #0d0f14)` }}
        >
          <div className="absolute inset-0 grid-canvas opacity-20" />
          {busy && !preview ? (
            <Loader2 className="absolute top-1/2 left-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-spin text-primary" />
          ) : (
            preview && (
              <img
                src={preview}
                alt={`${design.name} on ${mockup.label} mockup`}
                className="absolute rounded-sm object-cover shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]"
                style={{
                  left: `${mockup.frame.x}%`,
                  top: `${mockup.frame.y}%`,
                  width: `${mockup.frame.w}%`,
                  height: `${mockup.frame.h}%`,
                }}
              />
            )
          )}
          <span className="absolute bottom-2 left-3 font-mono text-[10px] text-muted-foreground">
            {mockup.label.toUpperCase()} MOCKUP · {design.name}
          </span>
        </div>

        <Button
          size="sm"
          className="mt-3"
          onClick={() => {
            if (!preview) return;
            const a = document.createElement("a");
            a.href = preview;
            a.download = `${design.name}-${mockup.id}-mockup.png`;
            a.click();
            log(`Exported ${mockup.label} mockup`, "export");
            toast.success("Mockup image downloaded");
          }}
        >
          Download mockup artwork
        </Button>
      </section>

      <aside className="space-y-4">
        <div className="panel p-4">
          <h3 className="mb-2 font-display text-sm font-bold">Design Doctor</h3>
          <ul className="space-y-1 text-xs">
            {issues.map((i, idx) => (
              <li key={idx} className={i.level === "info" ? "text-muted-foreground" : "text-warning"}>
                {i.level === "info" ? "ℹ" : "⚠"} {i.message}
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            className="mt-3 w-full"
            onClick={() => {
              checkpoint();
              setDesign(autoFix(design));
              toast.success("Applied all safe fixes");
            }}
          >
            Fix all
          </Button>
        </div>

        <div className="panel max-h-[420px] overflow-y-auto p-4">
          <h3 className="mb-2 font-display text-sm font-bold">Asset Library</h3>
          {ASSET_LIBRARY.map((group) => (
            <div key={group.category} className="mb-3">
              <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                {group.category}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {group.items.map((item) => (
                  <span key={item} className="rounded-md border border-border bg-surface-2/60 px-2 py-0.5 text-[11px]">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
