import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  createContext,
  FunctionComponent,
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from "react";

export const LightDarkContext = createContext({ toggleMode: () => {} });

const colorPalette = {
  primary: {
    main: "#E16D44",
  },
  secondary: {
    main: "#44B8E1",
  },
} as const;

const storedTheme = localStorage.getItem("theme") as "dark" | "light" | null;

const ToggleableThemeProvider: FunctionComponent<PropsWithChildren> = ({
  children,
}) => {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const defaultTheme = useMemo(() => {
    if (storedTheme) {
      return storedTheme;
    }
    if (prefersDarkMode) {
      return "dark";
    }
    return "light";
  }, [prefersDarkMode]);

  const [mode, setMode] = useState<"light" | "dark">(defaultTheme);

  const theme = useMemo(
    () =>
      createTheme({
        palette: { ...colorPalette, mode },
      }),
    [mode],
  );

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const newTheme = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      return newTheme;
    });
  }, []);

  return (
    <LightDarkContext.Provider value={{ toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </LightDarkContext.Provider>
  );
};

export default ToggleableThemeProvider;
