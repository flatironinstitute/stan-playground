import { ProjectContext } from "@SpCore/ProjectContextProvider";
import LoadProjectWindow from "@SpPages/LoadProjectWindow";
import SaveProjectWindow from "@SpPages/SaveProjectWindow";
import ModalWindow, { useModalWindow } from "@fi-sci/modal-window";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Toolbar from "@mui/material/Toolbar";
import { FunctionComponent, useContext } from "react";
import { Link } from "react-router-dom";

type Sidebar = {
  hasUnsavedChanges: boolean;
  collapsed: boolean;
};

const exampleLinks = [
  {
    name: "Linear regression",
    link: "https://gist.github.com/WardBrian/93d12876923790f23d9c5cb481e8cd34",
  },
  {
    name: "Disease transmission",
    link: "https://gist.github.com/WardBrian/e47253bf29282d0eabf13616265d393e",
  },
];

export const drawerWidth = 240;

const Sidebar: FunctionComponent<Sidebar> = ({
  hasUnsavedChanges,
  collapsed,
}) => {
  // note: this is close enough to pass in directly if we wish
  const { update } = useContext(ProjectContext);
  const {
    visible: saveProjectVisible,
    handleOpen: saveProjectOpen,
    handleClose: saveProjectClose,
  } = useModalWindow();
  const {
    visible: loadProjectVisible,
    handleOpen: loadProjectOpen,
    handleClose: loadProjectClose,
  } = useModalWindow();

  return (
    <Drawer
      open={!collapsed}
      variant="persistent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
    >
      {/* For spacing purposes */}
      <Toolbar />

      <h3>Examples</h3>

      {exampleLinks.map((example, i) => (
        <div key={i} className="SidebarContentWrapper">
          <Link replace to={`?project=${example.link}`}>
            {example.name}
          </Link>
        </div>
      ))}
      <Divider />
      <List>
        <ListItem>
          <Button
            variant="outlined"
            onClick={loadProjectOpen}
            disabled={hasUnsavedChanges}
          >
            Load project
          </Button>
        </ListItem>

        <ListItem>
          <Button
            variant="outlined"
            onClick={saveProjectOpen}
            disabled={hasUnsavedChanges}
          >
            Save project
          </Button>
        </ListItem>
        <ListItem>
          {/* This will probably be removed or replaced in the future. It's just for convenience during development. */}
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              const ok = window.confirm(
                "Are you sure you want to clear all data in the editors?",
              );
              if (!ok) return;
              update({ type: "clear" });
            }}
          >
            Clear all
          </Button>
        </ListItem>
      </List>
      <ModalWindow visible={loadProjectVisible} onClose={loadProjectClose}>
        <LoadProjectWindow onClose={loadProjectClose} />
      </ModalWindow>
      <ModalWindow visible={saveProjectVisible} onClose={saveProjectClose}>
        <SaveProjectWindow onClose={saveProjectClose} />
      </ModalWindow>
    </Drawer>
  );
};

export default Sidebar;
