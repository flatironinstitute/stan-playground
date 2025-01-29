import { FunctionComponent } from "react";
import CloseableDialog, { DialogControls } from "@SpComponents/CloseableDialog";
import ExportProjectPanel from "./ExportProjectWindow/ExportProjectPanel";

const ExportProjectWindow: FunctionComponent<
  Omit<DialogControls, "handleOpen">
> = ({ open, handleClose }) => {
  return (
    <CloseableDialog
      title="Load Project"
      id="loadProjectDialogue"
      open={open}
      handleClose={handleClose}
    >
      <ExportProjectPanel onClose={handleClose} />
    </CloseableDialog>
  );
};

export default ExportProjectWindow;
