/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState, useEffect } from "react";
import { UseMediaStreamResult } from "./use-media-stream-mux";

export function useScreenCapture(): UseMediaStreamResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    const handleStreamEnded = () => {
      console.log("Screen capture stream ended.");
      setIsStreaming(false);
      setStream(null);
    };
    if (stream) {
      stream
        .getTracks()
        .forEach((track) => track.addEventListener("ended", handleStreamEnded));
      return () => {
        stream
          .getTracks()
          .forEach((track) =>
            track.removeEventListener("ended", handleStreamEnded)
          );
      };
    }
  }, [stream]);

  const start = async () => {
    // Check if running in Electron by looking for the exposed API
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI) {
      console.error("Electron API not found. Running in standard browser?");
      // Fallback or throw error - For simplicity, let's just try getDisplayMedia
      // In a real app, you might want a better fallback or UI indication.
      try {
        const mediaStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        setStream(mediaStream);
        setIsStreaming(true);
        return mediaStream;
      } catch (err) {
        console.error("Error getting display media:", err);
        setIsStreaming(false);
        setStream(null);
        throw err; // Re-throw error so caller knows it failed
      }
    }

    console.log("Requesting screen sources via Electron API...");
    try {
      const sources: { id: string; name: string }[] =
        await electronAPI.getScreenSources();
      console.log("Available sources:", sources);

      if (sources.length === 0) {
        throw new Error("No screen sources found.");
      }

      // --- Source Selection Logic ---
      // For simplicity, automatically select the first screen source.
      // TODO: Implement a UI picker to let the user choose.
      let selectedSource = sources.find(
        (source: { id: string; name: string }) =>
          source.id.startsWith("screen:")
      );
      if (!selectedSource) {
        console.warn(
          "No screen source found, falling back to first available source:",
          sources[0]?.name
        );
        // Fallback to the very first source if no explicit screen is found
        if (sources.length > 0) {
          selectedSource = sources[0];
        } else {
          throw new Error(
            "No suitable screen or window source found to capture."
          );
        }
      }
      console.log("Selected source:", selectedSource.name, selectedSource.id);
      // -------------------------------

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: false, // Typically no audio with screen capture via getUserMedia
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: selectedSource.id,
          },
        } as any, // Use 'as any' because TS types don't include chromeMediaSourceId by default
      });

      setStream(mediaStream);
      setIsStreaming(true);
      console.log("Screen capture started successfully via Electron.");
      return mediaStream;
    } catch (err) {
      console.error("Error starting screen capture via Electron:", err);
      setIsStreaming(false);
      setStream(null);
      throw err; // Re-throw error
    }
  };

  const stop = () => {
    if (stream) {
      console.log("Stopping screen capture stream...");
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
  };

  const result: UseMediaStreamResult = {
    type: "screen",
    start,
    stop,
    isStreaming,
    stream,
  };

  return result;
}
