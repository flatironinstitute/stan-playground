import CompilationServerConnectionControl from "@SpStanc/CompilationServerConnectionControl";
import { Brightness7, DarkMode, Menu, QuestionMark } from "@mui/icons-material";
import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import { useTheme } from "@mui/material/styles";
import { LightDarkContext } from "app/ToggleableThemeProvider";
import { FunctionComponent, useContext } from "react";

type TopBarProps = {
  title: string;
  onSetCollapsed: (fn: (collapsed: boolean) => boolean) => void;
};

const TopBar: FunctionComponent<TopBarProps> = ({ title, onSetCollapsed }) => {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const { toggleMode } = useContext(LightDarkContext);

  return (
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
        <span className="TopBarSpacer" />
        <IconButton title="Toggle light/dark" size="small" onClick={toggleMode}>
          {isLight ? (
            <DarkMode fontSize="inherit" htmlColor="white" />
          ) : (
            <Brightness7 fontSize="inherit" />
          )}
        </IconButton>
        <CompilationServerConnectionControl />
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
  );
};

export default TopBar;
