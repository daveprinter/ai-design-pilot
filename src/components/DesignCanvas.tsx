import { useEffect, useRef, useState } from "react";
import { drawDesign, preloadDesignImages, type Design } from "@/lib/design";

export function DesignCanvas({
  design,
  showBleed,
  selectedId,
  onSelect,
  className,
}: {
  design: Design;
  showBleed?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pxPerMm, setPxPerMm] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      await preloadDesignImages(design);
      if (cancelled) return;
      const wrap = wrapRef.current;
      const canvas = canvasRef.current;
      if (!wrap || !canvas) return;
      const avail = wrap.clientWidth;
      const scale = Math.max(avail / design.widthMm, 0.01);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(design.widthMm * scale * dpr);
      canvas.height = Math.round(design.heightMm * scale * dpr);
      canvas.style.width = `${design.widthMm * scale}px`;
      canvas.style.height = `${design.heightMm * scale}px`;
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawDesign(ctx, design, scale, { showBleed: showBleed ?? false });
      setPxPerMm(scale);

      if (selectedId) {
        const o = design.objects.find((obj) => obj.id === selectedId);
        if (o) {
          ctx.save();
          ctx.strokeStyle = "#4cc9f0";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 4]);
          ctx.strokeRect(o.x * scale, o.y * scale, o.w * scale, o.h * scale);
          ctx.restore();
        }
      }
    };
    render();
    const ro = new ResizeObserver(() => render());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [design, showBleed, selectedId]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSelect) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xMm = (e.clientX - rect.left) / pxPerMm;
    const yMm = (e.clientY - rect.top) / pxPerMm;
    const hit = [...design.objects]
      .reverse()
      .find((o) => !o.hidden && xMm >= o.x && xMm <= o.x + o.w && yMm >= o.y && yMm <= o.y + o.h);
    onSelect(hit?.id ?? null);
  };

  return (
    <div ref={wrapRef} className={className ?? "grid-canvas w-full rounded-xl border border-border p-4"}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="mx-auto block max-w-full cursor-crosshair rounded-sm shadow-[0_20px_60px_-25px_rgba(0,0,0,0.9)]"
      />
    </div>
  );
}
