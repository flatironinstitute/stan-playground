import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import useMediaQuery from "@mui/material/useMediaQuery";

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
  ThemeSetting,
  UserSettingsContext,
} from "./UserSettings";

const colorPalette = {
  primary: {
    main: "#E16D44",
  },
  secondary: {
    main: "#44B8E1",
  },
} as const;

const defaultSettings = {
  theme: "light",
  pedantic: false,
  serverUrl: publicCompilationServerUrl,
} as const;

const loadStoredSettings = () => {
  const storedSettings = JSON.parse(localStorage.getItem("settings") ?? "null");
  if (storedSettings === null) {
    return null;
  }
  return {
    // apply defaults for forward compatibility
    ...defaultSettings,
    ...storedSettings,
  };
};

const storedSettings = loadStoredSettings();

const useStoredOrDefaultSettings = () => {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  if (storedSettings) {
    return storedSettings;
  }

  return {
    ...defaultSettings,
    theme: prefersDarkMode ? "dark" : "light",
  };
};

const UserSettingsProvider: FunctionComponent<PropsWithChildren> = ({
  children,
}) => {
  const {
    theme: defaultTheme,
    pedantic: defaultPedantic,
    serverUrl: defaultStanWasmServerUrl,
  } = useStoredOrDefaultSettings();

  const [settingsTab, setSettingsTab] = useState<SettingsTab>("compilation");
  const [themeMode, setThemeMode] = useState<ThemeSetting>(defaultTheme);
  const [pedantic, setPedantic] = useState<boolean>(defaultPedantic);
  const [stanWasmServerUrl, setStanWasmServerUrl] = useState<string>(
    defaultStanWasmServerUrl,
  );

  // persist to local storage
  useEffect(() => {
    localStorage.setItem(
      "settings",
      JSON.stringify({
        theme: themeMode,
        pedantic,
        serverUrl: stanWasmServerUrl,
      }),
    );
  }, [stanWasmServerUrl, themeMode, pedantic]);

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

  // ------------------- Theme -------------------

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: { ...colorPalette, mode: themeMode },
      }),
    [themeMode],
  );

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => {
      const newTheme = prev === "light" ? "dark" : "light";
      return newTheme;
    });
  }, []);

  // ------------------- Pedantic -------------------

  const togglePedantic = useCallback(() => {
    setPedantic((prev) => !prev);
  }, []);

  return (
    <UserSettingsContext.Provider
      value={{
        settingsWindow: {
          isOpen,
          openSettings,
          closeSettings,
          settingsTab,
        },
        theme: themeMode,
        toggleTheme,
        pedantic,
        togglePedantic,
        stanWasmServerUrl,
        setStanWasmServerUrl,
      }}
    >
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </UserSettingsContext.Provider>
  );
};

export default UserSettingsProvider;
