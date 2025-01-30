import { createTheme, ThemeProvider } from "@mui/material/styles";
// see https://mui.com/material-ui/customization/css-theme-variables/usage/#typescript
import type {} from "@mui/material/themeCssVarsAugmentation";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import CssBaseline from "@mui/material/CssBaseline";

import { FunctionComponent, PropsWithChildren } from "react";

const palette = {
  primary: {
    main: "#E16D44",
  },
  secondary: {
    main: "#44B8E1",
  },
} as const;

const muiTheme = createTheme({
  colorSchemes: { light: { palette }, dark: { palette } },
  cssVariables: {
    colorSchemeSelector: "class",
  },
});

const CustomTheming: FunctionComponent<PropsWithChildren> = ({ children }) => {
  return (
    <ThemeProvider theme={muiTheme} noSsr>
      <InitColorSchemeScript attribute="class" />
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default CustomTheming;
