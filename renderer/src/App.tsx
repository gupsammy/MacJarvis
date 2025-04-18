import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.scss";
import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import SidePanel from "./components/side-panel/SidePanel";
import { Altair } from "./components/altair/Altair";
import ControlTray from "./components/control-tray/ControlTray";
import cn from "classnames";

const host = "generativelanguage.googleapis.com";
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

function App() {
  // this video reference is used for displaying the active stream, whether that is the webcam or screen capture
  // feel free to style as you see fit
  const videoRef = useRef<HTMLVideoElement>(null);
  // either the screen capture, the video or null, if null we hide it
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  // State for API Key and prompt
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState<boolean>(false);
  const [isLoadingKey, setIsLoadingKey] = useState<boolean>(true); // Loading state
  const inputApiKeyRef = useRef<HTMLInputElement>(null);

  // Fetch API Key on mount
  useEffect(() => {
    const fetchApiKey = async () => {
      setIsLoadingKey(true);
      try {
        const key = await window.electronAPI.getApiKey();
        if (key) {
          setApiKey(key);
          setShowApiKeyPrompt(false);
        } else {
          // Key is null (likely packaged app without stored key)
          setApiKey(null);
          setShowApiKeyPrompt(true);
        }
      } catch (error) {
        console.error("Error fetching API key:", error);
        // Handle error appropriately, maybe show an error message
        setShowApiKeyPrompt(true); // Show prompt as fallback
      }
      setIsLoadingKey(false);
    };

    fetchApiKey();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handler for submitting the API key from the prompt
  const handleApiKeySubmit = async () => {
    const enteredKey = inputApiKeyRef.current?.value;
    if (enteredKey) {
      setIsLoadingKey(true);
      try {
        const success = await window.electronAPI.setApiKey(enteredKey);
        if (success) {
          setApiKey(enteredKey);
          setShowApiKeyPrompt(false);
        } else {
          // Handle case where setting key failed (e.g., in dev mode)
          console.warn("Setting API key via prompt failed or was ignored.");
          // Optionally show an error message to the user
        }
      } catch (error) {
        console.error("Error setting API key:", error);
        // Handle error appropriately
      }
      setIsLoadingKey(false);
    }
  };

  // Loading state display
  if (isLoadingKey) {
    return (
      <div className="App">
        <div className="loading">Loading API Key...</div>
      </div>
    ); // Basic loading indicator
  }

  // API Key Prompt Display
  if (showApiKeyPrompt) {
    return (
      <div className="App">
        <div className="api-key-prompt">
          <h2>Enter Gemini API Key</h2>
          <p>
            Please enter your Gemini API key. You can get one from Google AI
            Studio.
          </p>
          <input
            ref={inputApiKeyRef}
            type="password"
            placeholder="Your API Key"
          />
          <button onClick={handleApiKeySubmit} disabled={isLoadingKey}>
            Save Key
          </button>
          {/* You might want to add a link to Google AI Studio here */}
        </div>
      </div>
    );
  }

  // Main App Display (only when API key is available)
  if (!apiKey) {
    // This case should ideally be covered by loading/prompt, but acts as a fallback
    return (
      <div className="App">
        <div className="error">API Key not available. Please restart.</div>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Pass the fetched/entered apiKey to the provider */}
      <LiveAPIProvider url={uri} apiKey={apiKey}>
        <div className="streaming-console">
          <SidePanel />
          <main>
            <div className="main-app-area">
              {/* APP goes here */}
              <Altair />
              <video
                className={cn("stream", {
                  hidden: !videoRef.current || !videoStream,
                })}
                ref={videoRef}
                autoPlay
                playsInline
              />
            </div>

            <ControlTray
              videoRef={videoRef}
              supportsVideo={true}
              onVideoStreamChange={setVideoStream}
            >
              {/* put your own buttons here */}
            </ControlTray>
          </main>
        </div>
      </LiveAPIProvider>
    </div>
  );
}

export default App;
