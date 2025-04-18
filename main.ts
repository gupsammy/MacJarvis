import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  desktopCapturer,
} from "electron";
import path from "node:path";
import { existsSync } from "fs";
// electron-store is ESM, need to use dynamic import
// const Store = require("electron-store"); // Remove require
import type Store from "electron-store" with { "resolution-mode": "import" }; // Import type for Store
import dotenv from "dotenv";

// Define the expected schema for the store
interface StoreSchema {
  geminiApiKey?: string;
}

// Configure dotenv for development environment
if (!app.isPackaged) {
  dotenv.config({ path: path.join(__dirname, "..", ".env") });
}

// Initialize electron-store asynchronously
let store: any; // Use any type to bypass strict checks for electron-store

// If this is a second instance, quit it immediately
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

// Hide dock icon immediately when ready
app.whenReady().then(() => {
  if (app.dock) {
    app.dock.hide();
  }
});

let tray: Tray;
let win: BrowserWindow;

function createWindow(): void {
  win = new BrowserWindow({
    width: 420,
    height: 540,
    show: false,
    frame: false,
    resizable: false,
    movable: false,
    fullscreenable: false,
    skipTaskbar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (app.isPackaged) {
    // When packaged, __dirname points to /Resources/app.asar/dist
    // We need to go up one level from 'dist' and then into 'renderer/build'
    const htmlPath = path.join(__dirname, "..", "renderer/build", "index.html");
    console.log("Loading HTML from:", htmlPath);
    win.loadFile(htmlPath);
    // TEMPORARY: Open DevTools in packaged app for debugging
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadURL("http://localhost:3200");
    // Open DevTools automatically in development
    win.webContents.openDevTools({ mode: "detach" });
  }
}

app.whenReady().then(async () => {
  // Initialize Store within app.whenReady
  const { default: ElectronStore } = await import("electron-store");
  store = new ElectronStore();

  // Setup IPC Handlers *after* store is initialized
  setupIpcHandlers();

  // Hide dock icon (can stay here or move after createWindow)
  if (app.dock) {
    app.dock.hide();
  }

  // 1. Create the hidden window FIRST
  createWindow();

  // 2. Tray icon - try multiple possible locations for the icon
  let iconPath: string = "";
  const possibleIconPaths = [
    path.join(process.resourcesPath, "assets", "trayTemplate.png"),
    path.join(__dirname, "..", "assets", "trayTemplate.png"),
    path.join(__dirname, "../..", "assets", "trayTemplate.png"),
    path.join(__dirname, "../../assets", "trayTemplate.png"),
    path.join(app.getAppPath(), "assets", "trayTemplate.png"),
  ];

  if (app.isPackaged) {
    // Try all possible paths in production
    for (const testPath of possibleIconPaths) {
      console.log("Testing icon path:", testPath);
      if (existsSync(testPath)) {
        iconPath = testPath;
        console.log("Found icon at:", iconPath);
        break;
      }
    }
    // Fallback if not found
    if (!iconPath) {
      console.error(
        "Could not find tray icon in any location. Using first path anyway."
      );
      iconPath = possibleIconPaths[0];
    }
  } else {
    // In development, use the standard path
    iconPath = path.join(__dirname, "..", "assets", "trayTemplate.png");
  }

  console.log("App is packaged:", app.isPackaged);
  console.log("Final icon path:", iconPath);
  console.log("Resources path:", process.resourcesPath);
  console.log("__dirname:", __dirname);
  console.log("App path:", app.getAppPath());

  const icon = nativeImage.createFromPath(iconPath);

  if (icon.isEmpty()) {
    console.error("Failed to load tray icon from:", iconPath);
  }

  tray = new Tray(icon);
  tray.setToolTip("Gemini Tray");

  tray.on("click", () => {
    if (!win) {
      console.error("Window not available on tray click!");
      return;
    }
    if (win.isVisible()) {
      win.hide();
    } else {
      const { x, y, height } = tray.getBounds();
      win.setPosition(Math.round(x), Math.round(y + height));
      win.show();
    }
  });

  // 3. Context menu (optional)
  tray.setContextMenu(
    Menu.buildFromTemplate([{ label: "Quit", role: "quit" }])
  );
});

app.on("window-all-closed", () => {
  /* no-op: keep the tray running */
});

// Define IPC Handlers (can be defined globally, but setup called later)
function setupIpcHandlers() {
  // Remove await initializeStore(); from here

  // IPC handler for getting screen sources
  ipcMain.handle("get-screen-sources", async () => {
    const sources = await desktopCapturer.getSources({
      types: ["screen", "window"],
    });
    // Optional: You could filter or format sources here if needed
    // For example, provide thumbnails: sources.map(s => ({ id: s.id, name: s.name, thumbnail: s.thumbnail.toDataURL() }))
    return sources.map((s) => ({ id: s.id, name: s.name })); // Just return id and name for simplicity
  });

  // IPC handler for getting the API key
  ipcMain.handle("get-api-key", async () => {
    // Ensure store is available when handler is invoked
    if (!store) {
      console.error("Store not initialized when getting API key");
      return null;
    }
    if (!app.isPackaged) {
      // In development, prioritize .env file, fallback to store
      const envKey = process.env.GEMINI_API_KEY;
      if (envKey) {
        console.log("Using API Key from .env");
        return envKey;
      }
      // If no .env key, check if user saved one via UI during dev
      const storedKey = store.get("geminiApiKey", null);
      if (storedKey) {
        console.log("Using API Key from store (dev mode)");
        return storedKey;
      }
      return null; // No key found in dev
    } else {
      // In production, only get the key from store
      console.log("Using API Key from store (prod mode)");
      return store.get("geminiApiKey", null);
    }
  });

  // IPC handler for setting the API key (works in dev and prod)
  ipcMain.handle("set-api-key", async (event, key: string) => {
    // Ensure store is available when handler is invoked
    if (!store) {
      console.error("Store not initialized when setting API key");
      return false;
    }
    try {
      store.set("geminiApiKey", key);
      console.log("API Key saved to store.");
      return true; // Indicate success
    } catch (error) {
      console.error("Failed to save API Key to store:", error);
      return false; // Indicate failure
    }
  });
}
