// src/preload.d.ts
// This file tells TypeScript about the API exposed by preload.ts

// It's good practice to define an interface for your API
export interface IElectronAPI {
  getApiKey: () => Promise<string>;
  setApiKey: (key: string) => Promise<boolean>;
  // Add definitions for any other functions exposed via contextBridge here
}

// Extend the global Window interface
declare global {
  interface Window {
    electronAPI?: IElectronAPI; // Make it optional '?' if preload might not always run or expose it
  }
}

// This empty export makes the file a module, which is necessary for augmenting global types
export {};
