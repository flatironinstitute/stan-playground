import { DialogControls } from "@SpComponents/CloseableDialog";
import { createContext } from "react";

export type ThemeSetting = "light" | "dark";

export const publicCompilationServerUrl =
  "https://stan-wasm.flatironinstitute.org";
export const localCompilationServerUrl = "http://localhost:8083";
export type ServerType = "public" | "local" | "custom";

export type UserSettings = {
  settingsWindow: DialogControls;
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
    open: false,
    handleOpen: () => {},
    handleClose: () => {},
  },
  stanWasmServerUrl: "",
  setStanWasmServerUrl: () => {},
});
