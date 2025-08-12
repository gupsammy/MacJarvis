# Build Size Optimization Plan (Phase 1)

The current application build size is significant (~500MB), largely due to the Electron framework. Here are steps to reduce the size:

## 1. Analyze Renderer Bundle Size

Identify the largest modules in the frontend bundle.

- **Action:** Install `rollup-plugin-visualizer`. [DONE]
- **Action:** Update `renderer/vite.config.ts` to use the visualizer plugin. [DONE]
- **Action:** Run the renderer build (`npm run build-renderer`) and analyze the generated `stats.html` file. Pay attention to large libraries like Vega, react-syntax-highlighter, lodash, etc. [DONE - Ongoing Analysis]

## 2. Optimize Large Dependencies

Reduce the impact of heavy libraries identified in the analysis.

- **Action (Vega):**
  - Determine if `vega`, `vega-embed`, _and_ `vega-lite` are all strictly necessary. Can you use a subset? [DONE - Determined all 3 required via vega-embed peer dependencies]
  - Implement dynamic loading for components using Vega charts via `React.lazy` and `import()`. [DONE - via Altair component splitting]
- **Action (`react-syntax-highlighter`):**
  - Configure the library to _only_ bundle the specific languages required by the application instead of the default set. [DONE]
- **Action (`lodash`, `react-icons`, etc.):**
  - Verify tree-shaking is effective via the bundle visualizer. [DONE - Lodash uses specific imports]
  - Ensure specific imports are used where applicable (e.g., `import get from \'lodash/get\';`). [DONE - Lodash uses specific imports]

## 3. Implement Code Splitting

Load parts of the application on demand.

- **Action:** Identify React components or features (especially those using heavy libraries) not needed immediately. [DONE - Altair identified]
- **Action:** Refactor to load these components using `React.lazy` and dynamic `import()`. Wrap them in `<React.Suspense>` with a fallback UI. [DONE - Altair implemented]

## 4. Audit and Prune Dependencies

Remove unused packages.

- **Action:** Run `npx depcheck` in the project root directory. [DONE]
- **Action:** Run `npx depcheck` in the `renderer` directory. [DONE]
- **Action:** Review any reported unused dependencies and uninstall them if confirmed they are not needed. [DONE]

## 5. Review `electron-builder` Configuration

Ensure optimal packaging settings.

- **Action:** In the root `package.json`'s `"build"` section, explicitly ensure ASAR archiving is enabled: `"asar": true`. [DONE - Left as default true]
- **Action:** Evaluate if all build targets (e.g., `dmg` _and_ `zip` for Mac) are necessary. Removing targets reduces the number/size of build artifacts. [DONE - Removed zip]
- **Action:** Double-check that packages only needed for the build process itself are listed in `devDependencies`, not `dependencies`, in both `package.json` files. [DONE - Moved @google/generative-ai in renderer]

## 6. (Long-term Consideration)

- **Action:** If the above optimizations are insufficient and minimal size is paramount, evaluate migrating the application architecture from Electron to a more lightweight alternative like Tauri. Note that this requires significant effort.
