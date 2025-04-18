# MacJarvis

An Electron-based macOS application providing a system tray interface for interacting with the Google Gemini Live API.

## Features

- System tray icon for quick access.
- Handles API key securely in the main process.
- Uses Electron's IPC for communication between main and renderer processes.
- Frontend built with React (using Vite).
- Supports multimodal interactions (e.g., microphone, screen capture - requires Gemini API support).

## Acknowledgements

This project heavily utilizes and builds upon the foundation laid by the Google Gemini team's [live-api-web-console](https://github.com/google-gemini/live-api-web-console) repository. Much of the React component structure and Live API interaction logic originates from that project.

## Setup and Running

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd macjarvis
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure API Key:**
    - Create a `.env` file in the root directory.
    - Add your Gemini API key:
      ```
      GEMINI_API_KEY=YOUR_API_KEY_HERE
      ```
    - Alternatively, the application will prompt you for the key on first launch and store it securely.
4.  **Run in development mode:**

    ```bash
    npm run dev
    ```

    This will start the Vite dev server for the renderer and launch Electron.

5.  **Build for production:**
    ```bash
    npm run build
    ```
    This creates a packaged application (e.g., `.dmg` and `.zip` for macOS) in the `release/build` directory.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author

**Samarth Gupta**
Head of AI Engineering, NeuralHQ Technologies
[Samarth@neuralhq.ai](mailto:Samarth@neuralhq.ai)
