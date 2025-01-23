import { FunctionComponent, PropsWithChildren } from "react";
import ToggleableThemeProvider from "./Personalization/ToggleableThemeProvider";
import CompileContextProvider from "./Compilation/CompileContextProvider";
import PedanticSettingProvider from "./Personalization/PedanticSettingProvider";

const UserSettingsProvider: FunctionComponent<PropsWithChildren> = ({
  children,
}) => {
  return (
    <ToggleableThemeProvider>
      <CompileContextProvider>
        <PedanticSettingProvider>{children}</PedanticSettingProvider>
      </CompileContextProvider>
    </ToggleableThemeProvider>
  );
};

export default UserSettingsProvider;
