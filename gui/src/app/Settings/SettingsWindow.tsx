import ConfigureCompilationServerDialog from "@SpCompilation/CompilationServerDialog";
import CloseableDialog from "@SpComponents/CloseableDialog";
import { FunctionComponent } from "react";
import PersonalSettingsDialogue from "./PersonalSettingsDialogue";
import TabWidget from "@SpComponents/TabWidget";

type SettingsWindowProps = {
  open: boolean;
  close: () => void;
};

const SettingsWindow: FunctionComponent<SettingsWindowProps> = ({
  open,
  close,
}) => {
  return (
    <CloseableDialog
      title="Settings"
      id="settingsDialogue"
      open={open}
      handleClose={close}
    >
      <TabWidget labels={["Compilation Server", "Personalization Settings"]}>
        <ConfigureCompilationServerDialog />
        <PersonalSettingsDialogue />
      </TabWidget>
    </CloseableDialog>
  );
};

export default SettingsWindow;
