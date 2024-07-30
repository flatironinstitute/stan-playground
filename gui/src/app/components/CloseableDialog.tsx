import CloseIcon from "@mui/icons-material/Close";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import { FunctionComponent, PropsWithChildren, useState } from "react";

type CloseableDialogProps = {
  title: string;
  id: string;
  open: boolean;
  handleClose: () => void;
};

export const useDialogControls = () => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return { open, handleOpen, handleClose };
};

const CloseableDialog: FunctionComponent<
  PropsWithChildren<CloseableDialogProps>
> = ({ title, id, handleClose, open, children }) => {
  const theDialog = (
    <Dialog
      onClose={handleClose}
      aria-labelledby={`customized-dialog-title-${id}`}
      open={open}
    >
      <DialogTitle id={`customized-dialog-title-${id}`}>{title}</DialogTitle>
      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <CloseIcon />
      </IconButton>
      {children}
    </Dialog>
  );

  return theDialog;
};

export default CloseableDialog;
