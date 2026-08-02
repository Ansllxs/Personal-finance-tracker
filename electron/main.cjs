/**
 * Finance Tracker — proceso principal de Electron.
 * Arranca Next.js en local y guarda datos en userData (persistente).
 */

// Si el entorno fuerza Node, Electron no expone `app`
delete process.env.ELECTRON_RUN_AS_NODE;

const path = require("path");
const fs = require("fs");
const { createServer } = require("http");
const { parse } = require("url");
const { spawn } = require("child_process");
const http = require("http");
const { app, BrowserWindow, shell } = require("electron");

if (!app) {
  console.error(
    "[Finance Tracker] Ejecuta con Electron: npm run desktop\n(no uses node electron/main.cjs)"
  );
  process.exit(1);
}

app.setName("Finance Tracker");
// Carpeta amigable en Application Support
app.setPath(
  "userData",
  path.join(app.getPath("appData"), "Finance Tracker")
);

const PORT = Number(process.env.FINANCE_TRACKER_PORT) || 3847;

const dataDir = path.join(app.getPath("userData"), "data");
fs.mkdirSync(dataDir, { recursive: true });
process.env.FINANCE_TRACKER_DATA_DIR = dataDir;
process.env.ELECTRON = "1";

const isPackaged = app.isPackaged;
const projectRoot = isPackaged
  ? path.join(process.resourcesPath, "app")
  : path.join(__dirname, "..");

function maybeMigrateFromProjectData() {
  const dest = path.join(dataDir, "store.json");
  if (fs.existsSync(dest)) return;

  const candidates = [];
  if (!isPackaged) {
    candidates.push(path.join(projectRoot, ".data", "store.json"));
  }
  // Carpeta vieja (nombre del package.json)
  candidates.push(
    path.join(app.getPath("appData"), "finance-tracker", "data", "store.json")
  );

  for (const legacy of candidates) {
    try {
      if (fs.existsSync(legacy)) {
        fs.copyFileSync(legacy, dest);
        console.log("[Finance Tracker] Datos migrados desde", legacy);
        return;
      }
    } catch (err) {
      console.warn("[Finance Tracker] No se pudo migrar:", err.message);
    }
  }
}

maybeMigrateFromProjectData();

let mainWindow = null;
let httpServer = null;
let standaloneChild = null;

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 900,
    minHeight: 600,
    title: "Finance Tracker",
    backgroundColor: "#F7F1EA",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    show: false,
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function waitForServer(port, timeoutMs) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.get(`http://127.0.0.1:${port}`, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error("Timeout esperando al servidor local"));
        } else {
          setTimeout(tryOnce, 400);
        }
      });
    };
    tryOnce();
  });
}

async function startStandaloneServer() {
  const standaloneDir = path.join(process.resourcesPath, "standalone");
  const serverJs = path.join(standaloneDir, "server.js");

  if (!fs.existsSync(serverJs)) {
    throw new Error(
      `No se encontró el servidor en ${serverJs}. Ejecuta: npm run desktop:pack`
    );
  }

  standaloneChild = spawn(process.execPath, [serverJs], {
    cwd: standaloneDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      PORT: String(PORT),
      HOSTNAME: "127.0.0.1",
      FINANCE_TRACKER_DATA_DIR: dataDir,
    },
    stdio: "inherit",
  });

  standaloneChild.on("exit", (code) => {
    console.log("[Finance Tracker] Servidor terminó:", code);
  });

  await waitForServer(PORT, 90000);
  console.log(`[Finance Tracker] Datos → ${dataDir}`);
  return PORT;
}

async function startInProcessNext() {
  const next = require("next");
  const useDev =
    !isPackaged && process.env.NODE_ENV !== "production";

  // ELECTRON=1 → next.config usa distDir .next-electron
  const nextApp = next({
    dev: useDev,
    dir: projectRoot,
    hostname: "127.0.0.1",
    port: PORT,
  });
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  await new Promise((resolve, reject) => {
    httpServer = createServer((req, res) => {
      handle(req, res, parse(req.url, true));
    });
    httpServer.once("error", reject);
    httpServer.listen(PORT, "127.0.0.1", () => {
      console.log(
        `[Finance Tracker] ${useDev ? "dev" : "prod"} → http://127.0.0.1:${PORT}`
      );
      console.log(`[Finance Tracker] Datos → ${dataDir}`);
      resolve();
    });
  });

  return PORT;
}

async function startNextServer() {
  if (isPackaged) return startStandaloneServer();
  return startInProcessNext();
}

function cleanup() {
  if (httpServer) {
    try {
      httpServer.close();
    } catch {
      /* ignore */
    }
  }
  if (standaloneChild) {
    try {
      standaloneChild.kill();
    } catch {
      /* ignore */
    }
  }
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      const port = await startNextServer();
      createWindow(port);
    } catch (err) {
      console.error("[Finance Tracker] Error al iniciar:", err);
      app.quit();
    }

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow(PORT);
      }
    });
  });
}

app.on("before-quit", cleanup);
app.on("window-all-closed", () => {
  cleanup();
  if (process.platform !== "darwin") app.quit();
});
