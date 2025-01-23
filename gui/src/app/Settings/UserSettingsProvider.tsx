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

const defaultSettings = JSON.parse(
  localStorage.getItem("settings") ?? "null",
) as {
  theme: ThemeSetting;
  pedantic: boolean;
  serverUrl: string;
} | null;

const UserSettingsProvider: FunctionComponent<PropsWithChildren> = ({
  children,
}) => {
  // ------------------- Settings window -------------------
  const {
    open: isOpen,
    handleOpen,
    handleClose: closeSettings,
  } = useDialogControls();

  const [settingsTab, setSettingsTab] = useState<SettingsTab>("compilation");

  const openSettings = useCallback(
    (tab: SettingsTab) => {
      setSettingsTab(tab);
      handleOpen();
    },
    [handleOpen],
  );

  // ------------------- Theme -------------------
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const defaultTheme = useMemo(() => {
    if (defaultSettings) {
      return defaultSettings.theme;
    }
    if (prefersDarkMode) {
      return "dark";
    }
    return "light";
  }, [prefersDarkMode]);

  const [themeMode, setThemeMode] = useState<"light" | "dark">(defaultTheme);

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
  const defaultPedantic = useMemo(() => {
    if (defaultSettings?.pedantic) {
      return true;
    }

    return false;
  }, []);

  const [pedantic, setPedantic] = useState<boolean>(defaultPedantic);

  const togglePedantic = useCallback(() => {
    setPedantic((prev) => !prev);
  }, []);

  // ------------------- Compilation server -------------------
  const defaultStanWasmServerUrl = useMemo(() => {
    if (defaultSettings) {
      return defaultSettings.serverUrl;
    }

    return publicCompilationServerUrl;
  }, []);

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
