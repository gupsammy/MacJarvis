import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getScreenSources: () => ipcRenderer.invoke("get-screen-sources"),
  getApiKey: () => ipcRenderer.invoke("get-api-key"),
  setApiKey: (key: string) => ipcRenderer.invoke("set-api-key", key),
});

// Optional: Define types for the exposed API for better TypeScript integration in the renderer
declare global {
  interface Window {
    electronAPI: {
      getScreenSources: () => Promise<{ id: string; name: string }[]>;
      getApiKey: () => Promise<string | null>;
      setApiKey: (key: string) => Promise<boolean>;
    };
  }
}
