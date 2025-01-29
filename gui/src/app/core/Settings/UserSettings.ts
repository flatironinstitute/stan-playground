import { createContext } from "react";
import { SettingsTab } from "@SpWindows/SettingsWindow";

export type ThemeSetting = "light" | "dark";

export const publicCompilationServerUrl =
  "https://stan-wasm.flatironinstitute.org";
export const localCompilationServerUrl = "http://localhost:8083";
export type ServerType = "public" | "local" | "custom";

export type UserSettings = {
  settingsWindow: {
    isOpen: boolean;
    openSettings: (tab: SettingsTab) => void;
    closeSettings: () => void;
    settingsTab: SettingsTab;
  };
  pedantic: boolean;
  togglePedantic: () => void;
  theme: ThemeSetting;
  toggleTheme: () => void;
  stanWasmServerUrl: string;
  setStanWasmServerUrl: (url: string) => void;
};

export const UserSettingsContext = createContext<UserSettings>({
  pedantic: false,
  togglePedantic: () => {},
  theme: "light",
  toggleTheme: () => {},
  settingsWindow: {
    isOpen: false,
    openSettings: () => {},
    closeSettings: () => {},
    settingsTab: "compilation",
  },
  stanWasmServerUrl: "",
  setStanWasmServerUrl: () => {},
});

export const serverTypeForUrl = (url: string): ServerType => {
  return url === publicCompilationServerUrl
    ? "public"
    : url === localCompilationServerUrl
      ? "local"
      : "custom";
};
