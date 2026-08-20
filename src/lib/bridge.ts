import { download } from "./design";

export type BridgePermissions = {
  launchApps: boolean;
  processCheck: boolean;
  fileAccess: boolean;
};

export type ProcessInfo = { name: string; pid?: number; running: boolean };

const clean = (url: string) => url.replace(/\/$/, "");

/** Ask the bridge which desktop apps are currently running. */
export async function checkProcesses(
  bridgeUrl: string,
  names: string[],
): Promise<{ ok: boolean; message: string; processes: ProcessInfo[] }> {
  try {
    const res = await fetch(`${clean(bridgeUrl)}/processes?names=${encodeURIComponent(names.join(","))}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return { ok: false, message: `Bridge responded ${res.status}.`, processes: [] };
    const data = (await res.json().catch(() => ({}))) as { processes?: ProcessInfo[] };
    const processes = data.processes ?? [];
    const running = processes.filter((p) => p.running).map((p) => p.name);
    return {
      ok: true,
      message: running.length ? `Running: ${running.join(", ")}` : "None of the watched apps are running.",
      processes,
    };
  } catch {
    return {
      ok: false,
      message: "Pilot Bridge is not reachable — install and start it to enable process checking.",
      processes: [],
    };
  }
}

/** Ask the bridge to launch a desktop application (requires the launchApps permission). */
export async function launchApp(
  bridgeUrl: string,
  app: string,
  perms: BridgePermissions,
): Promise<{ ok: boolean; message: string }> {
  if (!perms.launchApps) {
    return { ok: false, message: "App launching is disabled. Enable “Open apps on this computer” first." };
  }
  try {
    const res = await fetch(`${clean(bridgeUrl)}/launch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return { ok: true, message: `Asked Pilot Bridge to open ${app}.` };
    return { ok: false, message: `Bridge responded ${res.status} — ${app} was not opened.` };
  } catch {
    return { ok: false, message: "Pilot Bridge offline — cannot open desktop apps." };
  }
}

function bridgeServerSource(perms: BridgePermissions, port: number) {
  return `/* Pilot Bridge - local helper for Pilot Graphic Designer & Branding
   Run:  node pilot-bridge.js       (Node 18+ required)
   Permissions granted by the designer:
     launch apps ....... ${perms.launchApps}
     process checking .. ${perms.processCheck}
     file access ....... ${perms.fileAccess}
*/
const http = require("http");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = ${port};
const PERMS = ${JSON.stringify(perms)};
const OUT = path.join(os.homedir(), "PilotBridge");
fs.mkdirSync(OUT, { recursive: true });

const COREL_PATHS = [
  "C:\\\\Program Files\\\\Corel\\\\CorelDRAW Graphics Suite X7\\\\Programs64\\\\CorelDRW.exe",
  "C:\\\\Program Files (x86)\\\\Corel\\\\CorelDRAW Graphics Suite X7\\\\Programs\\\\CorelDRW.exe",
];

function corelExe() {
  return COREL_PATHS.find((p) => fs.existsSync(p)) || null;
}

function json(res, code, body) {
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(body));
}

function body(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => { try { resolve(JSON.parse(data || "{}")); } catch { resolve({}); } });
  });
}

function tasklist() {
  return new Promise((resolve) => {
    const cmd = process.platform === "win32" ? "tasklist" : "ps -A -o comm";
    exec(cmd, { maxBuffer: 4 * 1024 * 1024 }, (err, stdout) => resolve(err ? "" : stdout.toLowerCase()));
  });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (req.method === "OPTIONS") return json(res, 204, {});

  if (url.pathname === "/status") {
    const exe = corelExe();
    return json(res, 200, {
      bridge: "pilot-bridge/1.0",
      platform: process.platform,
      permissions: PERMS,
      corelInstalled: Boolean(exe),
      path: exe,
      version: exe ? "CorelDRAW X7 (17.x)" : "not found",
    });
  }

  if (url.pathname === "/processes") {
    if (!PERMS.processCheck) return json(res, 403, { error: "process checking not permitted" });
    const names = (url.searchParams.get("names") || "coreldrw.exe").split(",").map((n) => n.trim()).filter(Boolean);
    const list = await tasklist();
    return json(res, 200, { processes: names.map((name) => ({ name, running: list.includes(name.toLowerCase()) })) });
  }

  if (url.pathname === "/launch" && req.method === "POST") {
    if (!PERMS.launchApps) return json(res, 403, { error: "launching apps not permitted" });
    const { app } = await body(req);
    const target = /corel/i.test(app || "") ? corelExe() || app : app;
    if (!target) return json(res, 404, { error: "application not found" });
    exec(process.platform === "win32" ? \`start "" "\${target}"\` : \`open -a "\${target}"\`);
    return json(res, 200, { launched: target });
  }

  if (url.pathname === "/import" && req.method === "POST") {
    if (!PERMS.fileAccess) return json(res, 403, { error: "file access not permitted" });
    const payload = await body(req);
    const name = (payload.document && payload.document.name ? payload.document.name : "pilot-design").replace(/[^\\w-]+/g, "_");
    const file = path.join(OUT, name + ".svg");
    fs.writeFileSync(file, payload.svg || "");
    if (PERMS.launchApps) {
      const exe = corelExe();
      if (exe) exec(\`start "" "\${exe}" "\${file}"\`);
    }
    return json(res, 200, { saved: file, command: payload.command, format: payload.format });
  }

  json(res, 404, { error: "unknown endpoint" });
}).listen(PORT, () => console.log("Pilot Bridge listening on http://localhost:" + PORT));
`;
}

/** Downloads the Pilot Bridge installer bundle (server + one-click starter + readme). */
export function downloadBridgeInstaller(bridgeUrl: string, perms: BridgePermissions) {
  const port = Number(bridgeUrl.split(":").pop()?.replace(/\D/g, "")) || 7317;
  download(new Blob([bridgeServerSource(perms, port)], { type: "text/javascript" }), "pilot-bridge.js");
  download(
    new Blob(
      [
        `@echo off\r\ntitle Pilot Bridge\r\necho Starting Pilot Bridge on port ${port}...\r\nnode "%~dp0pilot-bridge.js"\r\npause\r\n`,
      ],
      { type: "text/plain" },
    ),
    "install-pilot-bridge.bat",
  );
  download(
    new Blob(
      [
        `Pilot Bridge installation\n\n1. Install Node.js 18+ (https://nodejs.org) on the CorelDRAW machine.\n2. Put pilot-bridge.js and install-pilot-bridge.bat in the same folder.\n3. Double-click install-pilot-bridge.bat (keep the window open).\n4. Back in Pilot, press “Check if CorelDRAW is installed”.\n\nGranted permissions: launch apps=${perms.launchApps}, process check=${perms.processCheck}, file access=${perms.fileAccess}.\nBridge address: ${bridgeUrl}\nImported artwork is written to your home folder under PilotBridge/.\n`,
      ],
      { type: "text/plain" },
    ),
    "README-pilot-bridge.txt",
  );
}
