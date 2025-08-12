# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development Workflow
- `npm run dev` - Start development environment (runs renderer dev server, compiles main process, and launches Electron)
- `npm run dev-renderer` - Start only the Vite dev server for the React frontend (port 5173)
- `npm run dev-main-watch` - Compile and watch TypeScript for the main Electron process
- `npm run dev-main-start` - Start Electron with the compiled main process

### Build Commands
- `npm run build` - Full production build (cleans, builds main process, builds renderer, packages with electron-builder)
- `npm run build-main` - Compile TypeScript for main Electron process only
- `npm run build-renderer` - Build React frontend for production (inside renderer/ directory)
- `npm run clean` - Remove dist directories

### Renderer-Specific Commands (run from renderer/ directory)
- `cd renderer && npm run dev` - Start Vite dev server
- `cd renderer && npm run build` - Build React app with TypeScript compilation

## Architecture Overview

### Dual Package Structure
This is an Electron application with a split package architecture:
- **Root package**: Main Electron process and build configuration
- **renderer/ package**: React frontend with separate dependencies and build system

### Main Process (main.ts)
- Creates system tray application with no dock icon
- Handles API key management via electron-store (development uses .env fallback)
- Provides IPC handlers for screen capture sources and API key operations
- Uses dynamic ES module imports for electron-store compatibility
- Positions window below tray icon when clicked

### Renderer Process (React + Vite)
- React 18 application built with Vite
- Uses Google Gemini Live API for multimodal AI interactions
- Implements lazy loading for performance optimization (Altair component)
- API key managed through Electron IPC with fallback UI prompts
- Supports webcam, microphone, and screen capture streams

### Key Components Architecture
- **LiveAPIContext**: Provides Gemini Live API connection throughout the app
- **Altair**: Main visualization/interaction component (lazy loaded)
- **ControlTray**: Audio/video controls for multimodal input
- **SidePanel**: Navigation and controls interface
- **useLiveAPI hook**: Core integration with Google's multimodal Live API

### Technology Stack
- **Main Process**: Electron with TypeScript (NodeNext module resolution)
- **Renderer**: React 18 + TypeScript + Vite + SCSS
- **State Management**: Zustand for client state
- **API Integration**: @google/generative-ai for Gemini Live API
- **Build Tools**: electron-builder for packaging, Rollup visualizer for bundle analysis

### Security & Configuration
- Context isolation enabled with secure preload script
- API keys stored securely via electron-store
- Development uses .env files, production uses encrypted storage
- macOS permissions configured for microphone, camera, and screen recording
- Hardened runtime and Gatekeeper assessment enabled for macOS distribution

### File Structure Conventions
- TypeScript configuration split between main (`tsconfig.json`) and renderer (`renderer/tsconfig.json`)
- Assets stored in `assets/` and copied to resources during build
- Main process outputs to `dist/`, renderer outputs to `renderer/dist/`
- Vite configured for relative paths to support Electron packaging