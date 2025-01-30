import { FunctionComponent } from "react";
import LoadProjectPanel from "./LoadProjectWindow/LoadProjectPanel";
import CloseableDialog, { DialogControls } from "@SpComponents/CloseableDialog";

const LoadProjectWindow: FunctionComponent<
  Omit<DialogControls, "handleOpen">
> = ({ open, handleClose }) => {
  return (
    <CloseableDialog
      title="Load Project"
      id="loadProjectDialogue"
      open={open}
      handleClose={handleClose}
    >
      <LoadProjectPanel onClose={handleClose} />
    </CloseableDialog>
  );
};

export default LoadProjectWindow;
