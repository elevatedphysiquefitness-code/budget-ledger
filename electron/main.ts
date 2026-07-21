import { app, BrowserWindow } from "electron";
import { spawn, type ChildProcess } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

// Fixed name so the userData path (and thus the SQLite file location) is
// stable across dev and packaged runs, regardless of how Electron would
// otherwise derive app.getName().
app.setName("Budget Ledger");

const PORT = 47821;

let serverProcess: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;

function resolveServerPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "standalone", "server.js");
  }
  // electron/dist/main.js -> project root -> .next/standalone/server.js
  return path.join(__dirname, "..", "..", ".next", "standalone", "server.js");
}

/** Generated once per install and reused forever after — there's no file for
 *  a desktop user to hand-edit, so this replaces the .env.local ENCRYPTION_KEY
 *  step from the web/dev flow. lib/crypto.ts is unchanged: it just reads
 *  process.env.ENCRYPTION_KEY, which now arrives this way instead. */
function ensureEncryptionKey(userDataDir: string): string {
  const keyPath = path.join(userDataDir, "encryption.key");
  if (fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath, "utf-8").trim();
  }
  const key = crypto.randomBytes(32).toString("base64");
  fs.writeFileSync(keyPath, key, { mode: 0o600 });
  return key;
}

function startServer(): ChildProcess {
  const serverPath = resolveServerPath();
  const userDataDir = app.getPath("userData");
  const dataDir = path.join(userDataDir, "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const encryptionKey = ensureEncryptionKey(userDataDir);

  const child = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      PORT: String(PORT),
      // 0.0.0.0 so the app is reachable from other devices on the same WiFi
      // (e.g. a phone). The Electron window itself still loads 127.0.0.1
      // below — only the server's listen address changes.
      HOSTNAME: "0.0.0.0",
      DATA_DIR: dataDir,
      ENCRYPTION_KEY: encryptionKey,
      NODE_ENV: "production",
    },
    stdio: ["ignore", "pipe", "pipe"],
    cwd: path.dirname(serverPath),
  });

  child.stdout?.on("data", (chunk) => console.log(`[server] ${chunk}`.trimEnd()));
  child.stderr?.on("data", (chunk) => console.error(`[server] ${chunk}`.trimEnd()));
  child.on("exit", (code) => console.log(`[server] exited with code ${code}`));

  return child;
}

function waitForServer(url: string, timeoutMs = 20_000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.destroy();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error("Timed out waiting for the local server to start."));
          return;
        }
        setTimeout(attempt, 250);
      });
    };
    attempt();
  });
}

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 900,
    minWidth: 380,
    minHeight: 600,
    backgroundColor: "#0b0d10",
    title: "Budget Ledger",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const url = `http://127.0.0.1:${PORT}`;
  await mainWindow.loadURL(
    `data:text/html,<body style="background:#0b0d10;color:#e7e9ec;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">Starting Budget Ledger…</body>`
  );

  try {
    await waitForServer(url);
    await mainWindow.loadURL(url);
  } catch (error) {
    console.error(error);
    await mainWindow.loadURL(
      `data:text/html,<body style="background:#0b0d10;color:#e2584b;font-family:sans-serif;padding:2rem;">Failed to start the local server. Please restart the app.</body>`
    );
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  serverProcess = startServer();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  serverProcess?.kill();
});
