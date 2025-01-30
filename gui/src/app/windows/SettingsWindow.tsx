import PersonalSettingsArea from "@SpWindows/SettingsWindow/PersonalSettingsArea";
import CompilationServerArea from "@SpWindows/SettingsWindow/CompilationServerArea";
import CloseableDialog from "@SpComponents/CloseableDialog";
import { FunctionComponent, use, useMemo } from "react";
import TabWidget from "@SpComponents/TabWidget";
import { UserSettingsContext } from "@SpCore/Settings/UserSettings";

export type SettingsTab = "compilation" | "personalization";

const SettingsWindow: FunctionComponent = () => {
  const {
    settingsWindow: { isOpen, closeSettings, settingsTab },
  } = use(UserSettingsContext);

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
        <CompilationServerArea />
        <PersonalSettingsArea />
      </TabWidget>
    </CloseableDialog>
  );
};

export default SettingsWindow;
