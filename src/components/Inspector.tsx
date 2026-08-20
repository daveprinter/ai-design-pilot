import { Eye, EyeOff, Lock, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStudio } from "@/lib/studio";
import type { DesignObject } from "@/lib/design";

function Field({
  label,
  value,
  onChange,
  suffix,
  type = "number",
  step = 0.1,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  suffix?: string;
  type?: string;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{label}</span>
      <div className="relative">
        <Input
          type={type}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 bg-background/60 font-mono text-xs"
        />
        {suffix && (
          <span className="absolute top-1/2 right-2 -translate-y-1/2 text-[10px] text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

export function Inspector() {
  const { design, setDesign, selectedId, setSelectedId, checkpoint } = useStudio();
  const obj = design.objects.find((o) => o.id === selectedId);

  const patch = (p: Partial<DesignObject>) => {
    if (!obj) return;
    setDesign((d) => ({
      ...d,
      objects: d.objects.map((o) => (o.id === obj.id ? { ...o, ...p } : o)),
    }));
  };

  if (!obj) {
    return (
      <div className="panel p-4">
        <h3 className="font-display text-sm font-bold tracking-wide">OBJECT INSPECTOR</h3>
        <p className="mt-3 text-xs text-muted-foreground">
          Click any object on the canvas to inspect and edit its geometry, fill, outline and
          transparency.
        </p>
        <ul className="mt-4 space-y-1 font-mono text-[11px] text-muted-foreground">
          {design.objects.slice(0, 8).map((o) => (
            <li key={o.id}>
              <button className="hover:text-primary" onClick={() => setSelectedId(o.id)}>
                · {o.name} <span className="opacity-60">({o.type})</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold tracking-wide">OBJECT</h3>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => patch({ hidden: !obj.hidden })}>
            {obj.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => patch({ locked: !obj.locked })}>
            <Lock className={`h-3.5 w-3.5 ${obj.locked ? "text-primary" : ""}`} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive"
            onClick={() => {
              checkpoint();
              setDesign((d) => ({ ...d, objects: d.objects.filter((o) => o.id !== obj.id) }));
              setSelectedId(null);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="mb-3 space-y-0.5 border-y border-border py-2 font-mono text-[11px] text-muted-foreground">
        <div>Type: {obj.type === "text" ? "Artistic Text" : obj.type === "image" ? "Bitmap" : "Curve"}</div>
        <div>
          Width: {obj.w.toFixed(1)} mm · Height: {obj.h.toFixed(1)} mm
        </div>
        <div>
          X: {obj.x.toFixed(1)} mm · Y: {obj.y.toFixed(1)} mm
        </div>
        <div>
          Rotation: {obj.rotation}° · Fill: {design.colorMode}
        </div>
        <div>
          Outline: {obj.strokeWidth.toFixed(2)} mm · Transparency: {Math.round((1 - obj.opacity) * 100)}%
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="X" value={obj.x} suffix="mm" onChange={(v) => patch({ x: +v })} />
        <Field label="Y" value={obj.y} suffix="mm" onChange={(v) => patch({ y: +v })} />
        <Field label="Width" value={obj.w} suffix="mm" onChange={(v) => patch({ w: +v })} />
        <Field label="Height" value={obj.h} suffix="mm" onChange={(v) => patch({ h: +v })} />
        <Field label="Rotation" value={obj.rotation} suffix="°" step={1} onChange={(v) => patch({ rotation: +v })} />
        <Field label="Outline" value={obj.strokeWidth} suffix="mm" step={0.05} onChange={(v) => patch({ strokeWidth: +v })} />
        <Field
          label="Transparency"
          value={Math.round((1 - obj.opacity) * 100)}
          suffix="%"
          step={1}
          onChange={(v) => patch({ opacity: 1 - Math.min(100, Math.max(0, +v)) / 100 })}
        />
        {obj.type === "text" && (
          <Field label="Font size" value={obj.fontSize ?? 12} suffix="pt" step={0.5} onChange={(v) => patch({ fontSize: +v })} />
        )}
        <label className="block">
          <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Fill</span>
          <Input
            type="color"
            value={obj.fill === "transparent" ? "#000000" : obj.fill}
            onChange={(e) => patch({ fill: e.target.value })}
            className="h-8 cursor-pointer bg-background/60 p-1"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Outline</span>
          <Input
            type="color"
            value={obj.stroke === "transparent" ? "#000000" : obj.stroke}
            onChange={(e) => patch({ stroke: e.target.value })}
            className="h-8 cursor-pointer bg-background/60 p-1"
          />
        </label>
      </div>

      {obj.type === "text" && (
        <label className="mt-2 block">
          <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Text</span>
          <textarea
            value={obj.text ?? ""}
            onChange={(e) => patch({ text: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-md border border-input bg-background/60 p-2 text-xs"
          />
        </label>
      )}
    </div>
  );
}
