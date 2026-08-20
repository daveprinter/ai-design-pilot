import { useState } from "react";
import { toast } from "sonner";
import { Activity, CheckCircle2, Download, Link2, Loader2, PlugZap, Rocket, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useStudio } from "@/lib/studio";
import { detectCorel, sendToCorel } from "@/lib/corel";
import {
  checkProcesses,
  downloadBridgeInstaller,
  launchApp,
  type BridgePermissions,
  type ProcessInfo,
} from "@/lib/bridge";
import { EXPORT_FORMATS, type ExportFormat } from "@/lib/design";

const DEFAULT_PERMS: BridgePermissions = { launchApps: false, processCheck: false, fileAccess: false };

const WORKFLOWS = [
  {
    name: "Client Ready",
    steps: [
      "Save backup checkpoint",
      "Convert text to curves",
      "Check RGB colours → CMYK",
      "Check image resolution",
      "Add 3 mm bleed",
      "Check objects inside page",
      "Export PDF",
      "Create JPG preview",
    ],
  },
  {
    name: "Large Format Ready",
    steps: ["Scale to finished size", "Add 10 mm bleed", "Tile into panels", "Number panels", "Add alignment marks", "Export PDF per panel"],
  },
  {
    name: "Batch Export",
    steps: ["Select folder of .cdr files", "Convert files", "Export PDF + PNG + JPG", "Generate thumbnails", "Rename by job number"],
  },
];

export function CorelTab() {
  const { corel, setCorel, design, prefs, setPrefs, activity, log } = useStudio();
  const [checking, setChecking] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const perms: BridgePermissions = corel.permissions ?? DEFAULT_PERMS;
  const watched = corel.watchedApps ?? ["CorelDRW.exe"];

  const setPerm = (key: keyof BridgePermissions, value: boolean) =>
    setCorel((c) => ({ ...c, permissions: { ...(c.permissions ?? DEFAULT_PERMS), [key]: value } }));

  const check = async () => {
    setChecking(true);
    const res = await detectCorel(corel.bridgeUrl);
    setCorel((c) => ({ ...c, detected: res.detected, version: res.version }));
    log(res.message, "corel");
    toast[res.detected === "detected" ? "success" : "warning"]("Corel detection", { description: res.message });
    setChecking(false);
  };

  const scan = async () => {
    if (!perms.processCheck) {
      toast.warning("Process checking is off", { description: "Enable the permission below first." });
      return;
    }
    setScanning(true);
    const res = await checkProcesses(corel.bridgeUrl, watched);
    setProcesses(res.processes);
    log(`Process check — ${res.message}`, "corel");
    toast[res.ok ? "success" : "warning"]("Process check", { description: res.message });
    setScanning(false);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <section className="space-y-4">
        <div className="panel p-4">
          <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold">
            <Download className="h-4 w-4 text-primary" /> Install Pilot Bridge
          </h3>
          <p className="mb-3 text-[11px] text-muted-foreground">
            The bridge is a tiny helper that runs on the design computer. It lets Pilot detect CorelDRAW, check which
            apps are running, open desktop applications and push artwork straight into CorelDRAW X7. Choose the
            permissions you want to grant — they are baked into the installer you download.
          </p>

          <div className="space-y-2">
            <Row
              label="Open apps on this computer"
              hint="Pilot may launch CorelDRAW X7 and other desktop apps through the bridge."
              checked={perms.launchApps}
              onChange={(v) => setPerm("launchApps", v)}
            />
            <Row
              label="Process checking"
              hint="Pilot may see whether CorelDRAW, Photoshop or Illustrator are currently running."
              checked={perms.processCheck}
              onChange={(v) => setPerm("processCheck", v)}
            />
            <Row
              label="File access for imports"
              hint="Artwork is written to a PilotBridge folder in your home directory before import."
              checked={perms.fileAccess}
              onChange={(v) => setPerm("fileAccess", v)}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                downloadBridgeInstaller(corel.bridgeUrl, perms);
                log("Downloaded Pilot Bridge installer", "corel");
                toast.success("Installer downloaded", {
                  description: "Run install-pilot-bridge.bat next to pilot-bridge.js (Node 18+).",
                });
              }}
            >
              <Download className="mr-1 h-3.5 w-3.5" /> Download bridge installer
            </Button>
            <Button size="sm" variant="secondary" disabled={scanning} onClick={scan}>
              {scanning ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Activity className="mr-1 h-3.5 w-3.5" />}
              Check running apps
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const res = await launchApp(corel.bridgeUrl, "CorelDRAW", perms);
                log(res.message, "corel");
                toast[res.ok ? "success" : "warning"]("Open CorelDRAW", { description: res.message });
              }}
            >
              <Rocket className="mr-1 h-3.5 w-3.5" /> Open CorelDRAW
            </Button>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              {Object.values(perms).filter(Boolean).length}/3 permissions granted
            </span>
          </div>

          {processes.length > 0 && (
            <ul className="mt-3 grid gap-1 sm:grid-cols-3">
              {processes.map((p) => (
                <li
                  key={p.name}
                  className="flex items-center gap-2 rounded-md border border-border bg-surface-2/50 px-2 py-1 text-[11px]"
                >
                  {p.running ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  {p.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel p-4">
          <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold">
            <Link2 className="h-4 w-4 text-primary" /> Link to CorelDRAW X7
          </h3>

          <div className="space-y-3">
            <Row
              label="Link to CorelDRAW"
              hint="Enable the bridge between Pilot and the CorelDRAW X7 installation."
              checked={corel.linked}
              onChange={(v) => setCorel((c) => ({ ...c, linked: v }))}
            />
            <Row
              label="Allow auto uploading"
              hint="Every export is pushed straight into CorelDRAW after it is created."
              checked={corel.autoUpload}
              onChange={(v) => setCorel((c) => ({ ...c, autoUpload: v }))}
            />
            <Row
              label="Open New Document"
              hint="Imports arrive in a fresh CorelDRAW document instead of the active one."
              checked={corel.openNewDocument}
              onChange={(v) => setCorel((c) => ({ ...c, openNewDocument: v }))}
            />

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block">
                <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                  Bridge address
                </span>
                <Input
                  value={corel.bridgeUrl}
                  onChange={(e) => setCorel((c) => ({ ...c, bridgeUrl: e.target.value }))}
                  className="h-8 font-mono text-xs"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                  Upload format
                </span>
                <select
                  value={corel.importFormat}
                  onChange={(e) => setCorel((c) => ({ ...c, importFormat: e.target.value as ExportFormat }))}
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                >
                  {EXPORT_FORMATS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={check} disabled={checking}>
                {checking ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <PlugZap className="mr-1 h-3.5 w-3.5" />}
                Check if CorelDRAW is installed
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  const res = await sendToCorel(design, corel);
                  log(res.message, "corel");
                  toast[res.ok ? "success" : "warning"]("CorelDRAW bridge", { description: res.message });
                }}
              >
                Import current design now
              </Button>
              <span className="flex items-center gap-1 text-xs">
                {corel.detected === "detected" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-success" /> {corel.version}
                  </>
                ) : corel.detected === "not-found" ? (
                  <>
                    <XCircle className="h-4 w-4 text-destructive" /> Not detected
                  </>
                ) : (
                  <span className="text-muted-foreground">Status unknown</span>
                )}
              </span>
            </div>

            <p className="rounded-lg border border-border bg-surface-2/50 p-3 text-[11px] text-muted-foreground">
              A browser cannot read your hard drive directly. Pilot detects CorelDRAW through the small
              <span className="text-foreground"> Pilot Bridge </span> helper running on the design machine
              (default {corel.bridgeUrl}). When the bridge is offline, Pilot downloads a
              <span className="text-foreground"> .corelbridge </span> package plus an SVG payload you can import with
              File ▸ Import in CorelDRAW X7.
            </p>
          </div>
        </div>

        <div className="panel p-4">
          <h3 className="mb-3 font-display text-sm font-bold">Custom AI workflows</h3>
          <div className="grid gap-3 md:grid-cols-3">
            {WORKFLOWS.map((w) => (
              <div key={w.name} className="rounded-lg border border-border bg-surface-2/50 p-3">
                <p className="mb-2 text-xs font-semibold text-primary">{w.name}</p>
                <ol className="space-y-0.5 text-[11px] text-muted-foreground">
                  {w.steps.map((s) => (
                    <li key={s}>↓ {s}</li>
                  ))}
                </ol>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => {
                    log(`Ran workflow "${w.name}"`, "corel");
                    toast.success(`Workflow “${w.name}” queued`, { description: `${w.steps.length} steps` });
                  }}
                >
                  Run
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-4">
          <h3 className="mb-3 font-display text-sm font-bold">Preferences</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Default format</span>
              <select
                value={prefs.defaultFormat}
                onChange={(e) => setPrefs((p) => ({ ...p, defaultFormat: e.target.value as ExportFormat }))}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              >
                {EXPORT_FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Units</span>
              <select
                value={prefs.units}
                onChange={(e) => setPrefs((p) => ({ ...p, units: e.target.value as "mm" | "cm" | "in" }))}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="mm">mm</option>
                <option value="cm">cm</option>
                <option value="in">inch</option>
              </select>
            </label>
            <Row
              label="Show bleed guides"
              checked={prefs.showBleed}
              onChange={(v) => setPrefs((p) => ({ ...p, showBleed: v }))}
            />
            <Row
              label="Voice commands"
              checked={prefs.voiceEnabled}
              onChange={(v) => setPrefs((p) => ({ ...p, voiceEnabled: v }))}
            />
          </div>
        </div>
      </section>

      <aside className="panel max-h-[760px] overflow-y-auto p-4">
        <h3 className="mb-3 font-display text-sm font-bold">AI Execution Timeline</h3>
        {activity.length === 0 && <p className="text-xs text-muted-foreground">No activity yet this session.</p>}
        <ul className="space-y-2">
          {activity.map((a) => (
            <li key={a.id} className="border-l-2 border-primary/50 pl-3 text-[11px]">
              <span className="block text-muted-foreground">
                {new Date(a.at).toLocaleTimeString()} · {a.kind}
              </span>
              {a.text}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

function Row({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface-2/40 px-3 py-2">
      <span>
        <span className="block text-xs font-semibold">{label}</span>
        {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
