import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EXPORT_FORMATS, exportDesign, type Design, type ExportFormat } from "@/lib/design";
import { useStudio } from "@/lib/studio";
import { sendToCorel } from "@/lib/corel";

export function ExportPanel({ design }: { design: Design }) {
  const { prefs, setPrefs, corel, log } = useStudio();
  const [busy, setBusy] = useState<ExportFormat | null>(null);

  const run = async (format: ExportFormat) => {
    setBusy(format);
    try {
      const result = await exportDesign(design, format, prefs.dpi);
      log(`Exported ${result}`, "export");
      toast.success(`Exported ${format.toUpperCase()}`, { description: result });
      if (corel.linked && corel.autoUpload) {
        const res = await sendToCorel(design, corel);
        log(res.message, "corel");
        toast[res.ok ? "success" : "warning"]("CorelDRAW bridge", { description: res.message });
      }
    } catch (e) {
      toast.error("Export failed", { description: (e as Error).message });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold tracking-wide">EXPORT CENTER</h3>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>Resolution</span>
          <select
            value={prefs.dpi}
            onChange={(e) => setPrefs((p) => ({ ...p, dpi: +e.target.value }))}
            className="rounded-md border border-input bg-background px-2 py-1 font-mono"
          >
            {[72, 150, 300, 600].map((d) => (
              <option key={d} value={d}>
                {d} DPI
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {EXPORT_FORMATS.map((f) => (
          <button
            key={f.id}
            onClick={() => run(f.id)}
            disabled={busy !== null}
            className="flex items-center justify-between rounded-lg border border-border bg-surface-2/60 px-3 py-2 text-left transition-colors hover:border-primary/60 hover:bg-surface-2 disabled:opacity-50"
          >
            <span>
              <span className="block text-sm font-semibold">{f.label}</span>
              <span className="block text-[11px] text-muted-foreground">{f.detail}</span>
            </span>
            {busy === f.id ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Download className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => run(prefs.defaultFormat)}>
          Export page ({prefs.defaultFormat.toUpperCase()})
        </Button>
        <Button size="sm" variant="secondary" onClick={() => run("png")}>
          Export preview JPG/PNG
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            const res = await sendToCorel(design, corel);
            log(res.message, "corel");
            toast[res.ok ? "success" : "warning"]("CorelDRAW bridge", { description: res.message });
          }}
        >
          Send to CorelDRAW X7
        </Button>
      </div>
    </div>
  );
}
