/* eslint-disable @typescript-eslint/no-explicit-any */
import CompilationServerConnectionControl from "@SpStanc/CompilationServerConnectionControl";
import { Menu, QuestionMark } from "@mui/icons-material";
import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import { FunctionComponent } from "react";

type TopBarProps = {
  title: string;
  onSetCollapsed: (fn: (collapsed: boolean) => boolean) => void;
};

const TopBar: FunctionComponent<TopBarProps> = ({ title, onSetCollapsed }) => {
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
