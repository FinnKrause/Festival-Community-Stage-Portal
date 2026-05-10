import { AppState } from "@/lib/app_state";
import { useState, useEffect } from "react";

export function useAppState() {
  const [settings, setSettings] = useState<AppState>({
    enable_page: "TRUE",
    enable_player: "TRUE",
    enable_dj: "FALSE",
    dp_message: "",
    dj_name: "",
    dj_insta: "",
    dj_message: "",
  });

  useEffect(() => {
    fetch("/api/app-state")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setSettings(data.data);
      })
      .catch((err) => console.error("Failed to load state:", err));
  }, []);

  const pushNewApplicationState = async () => {
    try {
      await fetch("/api/app-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
    } catch (err) {
      console.error("Failed to sync state:", err);
    }
  };

  const updateSettings = (newState: AppState) => {
    if (newState.enable_dj === "TRUE" && settings.enable_dj === "FALSE") {
      newState.enable_page = "FALSE";
    } else if (
      newState.enable_page === "TRUE" &&
      settings.enable_page === "FALSE"
    ) {
      newState.enable_dj = "FALSE";
    }

    setSettings(newState);
  };

  return {
    appState: settings,
    setAppState: updateSettings,
    pushNewApplicationState,
  };
}
