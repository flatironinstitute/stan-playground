import CloseableDialog, {
  useDialogControls,
} from "@SpComponents/CloseableDialog";
import { ProjectContext } from "@SpCore/ProjectContextProvider";
import { modelHasUnsavedChanges } from "@SpCore/ProjectDataModel";
import LoadProjectWindow from "@SpPages/LoadProjectWindow";
import SaveProjectWindow from "@SpPages/SaveProjectWindow";
import { List, ListItem } from "@mui/material";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import Link from "@mui/material/Link";
import Toolbar from "@mui/material/Toolbar";
import { FunctionComponent, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";

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

export const drawerWidth = 180;

const Sidebar: FunctionComponent<Sidebar> = ({
  hasUnsavedChanges,
  collapsed,
}) => {
  // note: this is close enough to pass in directly if we wish
  const { data, update } = useContext(ProjectContext);

  const navigate = useNavigate();

  const dataModified = useMemo(() => modelHasUnsavedChanges(data), [data]);

  const {
    open: saveProjectVisible,
    handleOpen: saveProjectOpen,
    handleClose: saveProjectClose,
  } = useDialogControls();
  const {
    open: loadProjectVisible,
    handleOpen: loadProjectOpen,
    handleClose: loadProjectClose,
  } = useDialogControls();

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

      <div className="Sidebar">
        <h3>Examples</h3>

        <List>
          {exampleLinks.map((example, i) => (
            <ListItem key={i}>
              <Link
                component="button"
                onClick={() => {
                  if (
                    !dataModified ||
                    window.confirm(
                      "Are you sure you want to load this example? This will overwrite your current project.",
                    )
                  ) {
                    navigate(`?project=${example.link}`, { replace: true });
                  }
                }}
              >
                {example.name}
              </Link>
            </ListItem>
          ))}
        </List>

        <Divider />

        <List>
          <ListItem key="load-project">
            <Button
              variant="outlined"
              onClick={loadProjectOpen}
              disabled={hasUnsavedChanges}
            >
              Load project
            </Button>
          </ListItem>

          <ListItem key="save-project">
            <Button
              variant="outlined"
              onClick={saveProjectOpen}
              disabled={hasUnsavedChanges}
            >
              Save project
            </Button>
          </ListItem>

          {/* This will probably be removed or replaced in the future. It's just for convenience during development. */}
          <ListItem key="clear-all">
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
      </div>

      <CloseableDialog
        title={"Load Project"}
        id={"loadProjectDialog"}
        open={loadProjectVisible}
        handleClose={loadProjectClose}
      >
        <LoadProjectWindow onClose={loadProjectClose} />
      </CloseableDialog>
      <CloseableDialog
        title={"Save this project"}
        id={"saveProjectDialog"}
        open={saveProjectVisible}
        handleClose={saveProjectClose}
      >
        <SaveProjectWindow onClose={saveProjectClose} />
      </CloseableDialog>
    </Drawer>
  );
};

export default Sidebar;
