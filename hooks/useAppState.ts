import { AppState } from "@/lib/types";
import { useState, useEffect } from "react";

export function useAppState() {
  const [settings, setSettings] = useState<AppState>({
    enable_autoplay: "FALSE",
    enable_page: "TRUE",
    enable_player: "TRUE",
    enable_dj: "FALSE",
    dp_message: "",
    autoplay_message: "",
    dj_name: "",
    dj_insta: "",
    dj_message: "",
    dj_avatar_url: "",
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
    const updated = { ...newState };

    const djChangedToTrue =
      updated.enable_dj === "TRUE" && settings.enable_dj !== "TRUE";
    const autoplayChangedToTrue =
      updated.enable_autoplay === "TRUE" && settings.enable_autoplay !== "TRUE";
    const pageChangedToTrue =
      updated.enable_page === "TRUE" && settings.enable_page !== "TRUE";

    if (djChangedToTrue) {
      updated.enable_autoplay = "FALSE";
      updated.enable_page = "FALSE";
      updated.enable_player = "FALSE";
    } else if (autoplayChangedToTrue) {
      updated.enable_page = "TRUE";
      updated.enable_dj = "FALSE";
    } else if (pageChangedToTrue) {
      updated.enable_dj = "FALSE";
    }

    setSettings(updated);
  };

  return {
    appState: settings,
    setAppState: updateSettings,
    pushNewApplicationState,
  };
}
