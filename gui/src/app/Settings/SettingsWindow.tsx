import ConfigureCompilationServerDialog from "@SpSettings/CompilationServerDialog";
import CloseableDialog from "@SpComponents/CloseableDialog";
import { FunctionComponent, useContext, useMemo } from "react";
import PersonalSettingsDialogue from "./PersonalSettingsDialogue";
import TabWidget from "@SpComponents/TabWidget";
import { UserSettingsContext } from "./UserSettings";

type SettingsWindowProps = {
  // none
};

export type SettingsTab = "compilation" | "personalization";

const SettingsWindow: FunctionComponent<SettingsWindowProps> = () => {
  const {
    settingsWindow: { isOpen, closeSettings, settingsTab },
  } = useContext(UserSettingsContext);

  const override = useMemo(() => {
    return settingsTab === "compilation" ? 0 : 1;
  }, [settingsTab]);

  return (
    <CloseableDialog
      title="Settings"
      id="settingsDialogue"
      open={isOpen}
      handleClose={closeSettings}
    >
      <TabWidget
        labels={["Compilation Server", "Personalization"]}
        forcedSelection={override}
      >
        <ConfigureCompilationServerDialog />
        <PersonalSettingsDialogue />
      </TabWidget>
    </CloseableDialog>
  );
};

export default SettingsWindow;
