import CloseableDialog, {
  useDialogControls,
} from "@SpComponents/CloseableDialog";
import { ProjectContext } from "@SpCore/ProjectContextProvider";
import { unsavedChangesString } from "@SpCore/ProjectDataModel";
import LoadProjectWindow from "@SpPages/LoadProjectWindow";
import ExportProjectWindow from "@SpPages/ExportProjectWindow";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import { FunctionComponent, use, useMemo } from "react";
import { useNavigate } from "react-router-dom";

type SidebarProps = {
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

const Sidebar: FunctionComponent<SidebarProps> = ({ collapsed }) => {
  // note: this is close enough to pass in directly if we wish
  const { data } = use(ProjectContext);

  const navigate = useNavigate();

  const { dataModified, unsavedString } = useMemo(() => {
    const s = unsavedChangesString(data);
    if (s.length === 0) {
      return { dataModified: false, unsavedString: "" };
    }
    return {
      dataModified: true,
      unsavedString: `The following files have unsaved changes: ${s}`,
    };
  }, [data]);

  const {
    open: exportProjectVisible,
    handleOpen: exportProjectOpen,
    handleClose: exportProjectClose,
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
            <Tooltip title={unsavedString}>
              <span style={{ width: "100%" }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={loadProjectOpen}
                  disabled={dataModified}
                >
                  Load project
                </Button>
              </span>
            </Tooltip>
          </ListItem>

          <ListItem key="export-project">
            <Tooltip title={unsavedString}>
              {/* span only exists so that this is still hover-able when disabled */}
              <span style={{ width: "100%" }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={exportProjectOpen}
                  disabled={dataModified}
                >
                  Export project
                </Button>
              </span>
            </Tooltip>
          </ListItem>
        </List>
      </div>

      <CloseableDialog
        title="Load Project"
        id="loadProjectDialog"
        open={loadProjectVisible}
        handleClose={loadProjectClose}
      >
        <LoadProjectWindow onClose={loadProjectClose} />
      </CloseableDialog>
      <CloseableDialog
        title="Export this project"
        id="exportProjectDialog"
        open={exportProjectVisible}
        handleClose={exportProjectClose}
      >
        <ExportProjectWindow onClose={exportProjectClose} />
      </CloseableDialog>
    </Drawer>
  );
};

export default Sidebar;
