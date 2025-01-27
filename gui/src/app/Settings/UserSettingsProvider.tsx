import { useColorScheme } from "@mui/material/styles";

import {
  FunctionComponent,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useDialogControls } from "@SpComponents/CloseableDialog";

import { SettingsTab } from "./SettingsWindow";
import {
  publicCompilationServerUrl,
  UserSettingsContext,
} from "./UserSettings";

const defaultSettings = {
  pedantic: false,
  serverUrl: publicCompilationServerUrl,
} as const;

const loadStoredSettings = () => {
  const storedSettings = JSON.parse(localStorage.getItem("settings") ?? "null");
  if (storedSettings === null) {
    return defaultSettings;
  }
  return {
    // apply defaults for forward compatibility
    ...defaultSettings,
    ...storedSettings,
  };
};

const { pedantic: defaultPedantic, serverUrl: defaultStanWasmServerUrl } =
  loadStoredSettings();

const UserSettingsProvider: FunctionComponent<PropsWithChildren> = ({
  children,
}) => {
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("compilation");
  const [pedantic, setPedantic] = useState<boolean>(defaultPedantic);
  const [stanWasmServerUrl, setStanWasmServerUrl] = useState<string>(
    defaultStanWasmServerUrl,
  );

  // persist to local storage
  useEffect(() => {
    localStorage.setItem(
      "settings",
      JSON.stringify({
        pedantic,
        serverUrl: stanWasmServerUrl,
      }),
    );
  }, [stanWasmServerUrl, pedantic]);

  // ------------------- Settings window -------------------
  const {
    open: isOpen,
    handleOpen,
    handleClose: closeSettings,
  } = useDialogControls();

  const openSettings = useCallback(
    (tab: SettingsTab) => {
      setSettingsTab(tab);
      handleOpen();
    },
    [handleOpen],
  );

  // ------------------- Pedantic -------------------

  const togglePedantic = useCallback(() => {
    setPedantic((prev) => !prev);
  }, []);

  // ------------------- Theme -------------------
  // defaults and storage handled by mui
  const { mode, setMode, systemMode } = useColorScheme();
  const theme = useMemo(
    () => (mode === "system" ? systemMode : mode) ?? "light",
    [mode, systemMode],
  );
  const isLight = useMemo(() => theme === "light", [theme]);

  const toggleTheme = useCallback(() => {
    setMode(isLight ? "dark" : "light");
  }, [isLight, setMode]);

  return (
    <UserSettingsContext
      value={{
        settingsWindow: {
          isOpen,
          openSettings,
          closeSettings,
          settingsTab,
        },
        theme,
        toggleTheme,
        pedantic,
        togglePedantic,
        stanWasmServerUrl,
        setStanWasmServerUrl,
      }}
    >
      {children}
    </UserSettingsContext>
  );
};

export default UserSettingsProvider;
