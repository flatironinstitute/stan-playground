import {
  Brightness7,
  Cancel,
  Check,
  DarkMode,
  Menu,
  QuestionMark,
  Settings,
} from "@mui/icons-material";
import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import { FunctionComponent, use, useMemo } from "react";
import SettingsWindow from "@SpWindows/SettingsWindow";
import {
  serverTypeForUrl,
  UserSettingsContext,
} from "@SpCore/Settings/UserSettings";
import { CompileContext } from "@SpCore/Compilation/CompileContextProvider";
import Typography from "@mui/material/Typography";

type TopBarProps = {
  title: string;
  onSetCollapsed: (fn: (collapsed: boolean) => boolean) => void;
};

const TopBar: FunctionComponent<TopBarProps> = ({ title, onSetCollapsed }) => {
  const {
    toggleTheme,
    theme,
    settingsWindow: { openSettings },
    stanWasmServerUrl,
  } = use(UserSettingsContext);
  const isLight = useMemo(() => theme === "light", [theme]);

  const { isConnected } = use(CompileContext);

  const serverType = serverTypeForUrl(stanWasmServerUrl);
  return (
    <>
      <AppBar
        position="sticky"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar
          variant="dense"
          sx={{
            minHeight: "0px",
          }}
        >
          <IconButton
            color="inherit"
            aria-label="open menu"
            onClick={() => onSetCollapsed((b) => !b)}
            edge="start"
          >
            <Menu />
          </IconButton>
          Stan Playground - {title}
          <span className="MenuBarSpacer" />
          <IconButton
            title="Toggle light/dark"
            size="small"
            onClick={toggleTheme}
          >
            {isLight ? (
              <DarkMode fontSize="inherit" htmlColor="white" />
            ) : (
              <Brightness7 fontSize="inherit" />
            )}
          </IconButton>
          <IconButton
            onClick={() => openSettings("compilation")}
            color="inherit"
            size="small"
          >
            {isConnected ? (
              <Check htmlColor="lightgreen" fontSize="inherit" />
            ) : (
              <Cancel htmlColor="pink" fontSize="inherit" />
            )}
            &nbsp;
            <Typography color="white" fontSize={12}>
              {isConnected ? "connected to " : "not connected to "}
              {serverType}
            </Typography>
          </IconButton>
          <IconButton
            title="Settings"
            size="small"
            onClick={() => openSettings("personalization")}
          >
            <Settings fontSize="inherit" htmlColor="white" />
          </IconButton>
          <IconButton
            title="About Stan Playground"
            size="small"
            onClick={() =>
              window.open(
                "https://github.com/flatironinstitute/stan-playground",
                "_blank",
              )
            }
          >
            <QuestionMark fontSize="inherit" htmlColor="white" />
          </IconButton>
        </Toolbar>
      </AppBar>

      <SettingsWindow />
    </>
  );
};

export default TopBar;
