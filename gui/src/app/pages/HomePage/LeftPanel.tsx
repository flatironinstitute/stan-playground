import { ProjectContext } from "@SpCore/ProjectContextProvider";
import LoadProjectWindow from "@SpPages/LoadProjectWindow";
import SaveProjectWindow from "@SpPages/SaveProjectWindow";
import { SmallIconButton } from "@fi-sci/misc";
import ModalWindow, { useModalWindow } from "@fi-sci/modal-window";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { FunctionComponent, useContext } from "react";
import { Link } from "react-router-dom";

type LeftPanelProps = {
  width: number;
  height: number;
  hasUnsavedChanges: boolean;
  collapsed: boolean;
  onSetCollapsed: (collapsed: boolean) => void;
};

const examplesStanies = [
  {
    name: "Linear regression",
    link: "https://gist.github.com/WardBrian/93d12876923790f23d9c5cb481e8cd34",
  },
  {
    name: "Disease transmission",
    link: "https://gist.github.com/WardBrian/e47253bf29282d0eabf13616265d393e",
  },
];

const LeftPanel: FunctionComponent<LeftPanelProps> = ({
  width,
  height,
  hasUnsavedChanges,
  collapsed,
  onSetCollapsed,
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

  if (collapsed) {
    return (
      <div
        style={{
          position: "absolute",
          width,
          height,
          backgroundColor: "lightgray",
          overflowY: "auto",
        }}
      >
        <div style={{ margin: 5 }}>
          <ExpandButton onClick={() => onSetCollapsed(false)} />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        width,
        height,
        backgroundColor: "lightgray",
        overflowY: "auto",
      }}
    >
      <div style={{ margin: 5 }}>
        <CollapseButton onClick={() => onSetCollapsed(true)} />
        <h3>Examples</h3>

        {examplesStanies.map((stanie, i) => (
          <div key={i} style={{ margin: 5 }}>
            <Link to={`?project=${stanie.link}`}>{stanie.name}</Link>
          </div>
        ))}
        <hr />
        <div>
          <button onClick={loadProjectOpen} disabled={hasUnsavedChanges}>
            Load project
          </button>
          &nbsp;
          <button onClick={saveProjectOpen} disabled={hasUnsavedChanges}>
            Save project
          </button>
        </div>
        <div>&nbsp;</div>
        <div>
          {/* This will probably be removed or replaced in the future. It's just for convenience during development. */}
          <button
            onClick={() => {
              const ok = window.confirm(
                "Are you sure you want to clear all data in the editors?",
              );
              if (!ok) return;
              update({ type: "clear" });
            }}
          >
            Clear all
          </button>
        </div>
      </div>
      <ModalWindow visible={loadProjectVisible} onClose={loadProjectClose}>
        <LoadProjectWindow onClose={loadProjectClose} />
      </ModalWindow>
      <ModalWindow visible={saveProjectVisible} onClose={saveProjectClose}>
        <SaveProjectWindow onClose={saveProjectClose} />
      </ModalWindow>
    </div>
  );
};

const ExpandButton: FunctionComponent<{ onClick: () => void }> = ({
  onClick,
}) => {
  return (
    <SmallIconButton icon={<ChevronRight />} onClick={onClick} title="Expand" />
  );
};

const CollapseButton: FunctionComponent<{ onClick: () => void }> = ({
  onClick,
}) => {
  return (
    <SmallIconButton
      icon={<ChevronLeft />}
      onClick={onClick}
      title="Collapse"
    />
  );
};

export default LeftPanel;
