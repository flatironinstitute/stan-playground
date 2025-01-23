import ConfigureCompilationServerDialog from "@SpSettings/CompilationServerDialog";
import CloseableDialog from "@SpComponents/CloseableDialog";
import { FunctionComponent, useContext } from "react";
import PersonalSettingsDialogue from "./PersonalSettingsDialogue";
import TabWidget from "@SpComponents/TabWidget";
import { UserSettingsContext } from "./UserSettings";

type SettingsWindowProps = {
  // none
};

const SettingsWindow: FunctionComponent<SettingsWindowProps> = () => {
  const {
    settingsWindow: { open, handleClose },
  } = useContext(UserSettingsContext);

  return (
    <CloseableDialog
      title="Settings"
      id="settingsDialogue"
      open={open}
      handleClose={handleClose}
    >
      <TabWidget labels={["Compilation Server", "Personalization Settings"]}>
        <ConfigureCompilationServerDialog />
        <PersonalSettingsDialogue />
      </TabWidget>
    </CloseableDialog>
  );
};

export default SettingsWindow;
