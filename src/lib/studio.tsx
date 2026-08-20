import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "./storage";
import { DEFAULT_BRAND, TEMPLATES, templateToDesign, type BrandInput } from "./templates";
import type { Design, ExportFormat } from "./design";
import type { BridgePermissions } from "./bridge";

export type CorelSettings = {
  linked: boolean;
  autoUpload: boolean;
  detected: "unknown" | "detected" | "not-found";
  version: string;
  importFormat: ExportFormat;
  openNewDocument: boolean;
  bridgeUrl: string;
  permissions: BridgePermissions;
  watchedApps: string[];
};

export type Prefs = {
  dpi: number;
  defaultFormat: ExportFormat;
  defaultBleed: number;
  units: "mm" | "cm" | "in";
  showBleed: boolean;
  voiceEnabled: boolean;
};

export type ActivityEntry = { id: string; at: number; text: string; kind: "ai" | "export" | "corel" | "edit" };

type StudioValue = {
  brand: BrandInput;
  setBrand: (b: BrandInput | ((p: BrandInput) => BrandInput)) => void;
  design: Design;
  setDesign: (d: Design | ((p: Design) => Design)) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  corel: CorelSettings;
  setCorel: (c: CorelSettings | ((p: CorelSettings) => CorelSettings)) => void;
  prefs: Prefs;
  setPrefs: (p: Prefs | ((p: Prefs) => Prefs)) => void;
  activity: ActivityEntry[];
  log: (text: string, kind?: ActivityEntry["kind"]) => void;
  checkpoint: () => void;
  undo: () => void;
  canUndo: boolean;
};

const StudioContext = createContext<StudioValue | null>(null);

const firstDesign = () => templateToDesign(TEMPLATES[0]!, DEFAULT_BRAND);

export function StudioProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = usePersistentState<BrandInput>("brand", DEFAULT_BRAND);
  const [design, setDesign] = usePersistentState<Design>("design", firstDesign());
  const [selectedId, setSelectedId] = usePersistentState<string | null>("selected", null);
  const [history, setHistory] = usePersistentState<Design[]>("history", []);
  const [activity, setActivity] = usePersistentState<ActivityEntry[]>("activity", []);
  const [corel, setCorel] = usePersistentState<CorelSettings>("corel", {
    linked: false,
    autoUpload: false,
    detected: "unknown",
    version: "CorelDRAW X7 (17.x)",
    importFormat: "svg",
    openNewDocument: true,
    bridgeUrl: "http://localhost:7317",
  });
  const [prefs, setPrefs] = usePersistentState<Prefs>("prefs", {
    dpi: 300,
    defaultFormat: "pdf",
    defaultBleed: 3,
    units: "mm",
    showBleed: true,
    voiceEnabled: true,
  });

  const value = useMemo<StudioValue>(
    () => ({
      brand,
      setBrand,
      design,
      setDesign,
      selectedId,
      setSelectedId,
      corel,
      setCorel,
      prefs,
      setPrefs,
      activity,
      log: (text, kind = "edit") =>
        setActivity((prev) =>
          [{ id: Math.random().toString(36).slice(2), at: Date.now(), text, kind }, ...prev].slice(0, 60),
        ),
      checkpoint: () => setHistory((prev) => [design, ...prev].slice(0, 15)),
      undo: () =>
        setHistory((prev) => {
          const [last, ...rest] = prev;
          if (last) setDesign(last);
          return rest;
        }),
      canUndo: history.length > 0,
    }),
    [brand, design, selectedId, corel, prefs, activity, history, setBrand, setDesign, setSelectedId, setCorel, setPrefs, setActivity, setHistory],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used inside StudioProvider");
  return ctx;
}
