import { useTheme } from "@mui/material/styles";
import { Brightness7, DarkMode } from "@mui/icons-material";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";

import { useContext } from "react";

import { LightDarkContext } from "@SpSettings/ToggleableThemeProvider";
import { PedanticContext } from "@SpSettings/PedanticSettingProvider";
import { ProjectContext } from "@SpCore/ProjectContextProvider";

const PersonalSettingsDialogue = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const { toggleMode } = useContext(LightDarkContext);
  const { update } = useContext(ProjectContext);
  const { pedantic, togglePedantic } = useContext(PedanticContext);

  return (
    <div className="dialogWrapper">
      <h3>Appearance</h3>
      <Button
        title="Toggle light/dark"
        variant="contained"
        onClick={toggleMode}
        startIcon={
          isLight ? (
            <DarkMode fontSize="inherit" />
          ) : (
            <Brightness7 fontSize="inherit" />
          )
        }
      >
        Toggle {isLight ? "Dark" : "Light"} mode
      </Button>
      <h3>Warnings</h3>
      <p>
        &quot;Pedantic Mode&quot; is an option in the Stan compiler to enable
        additional warnings. These can be instructive, but they can also lead to
        false positives. If the compiler is giving you a warning that you think
      </p>

      <Switch
        checked={pedantic}
        onChange={togglePedantic}
        color="primary"
        name="pedantic"
        aria-label="toggle pedantic mode"
        title="Toggle pedantic mode"
      />

      <h3> Reset to defaults</h3>
      <p>
        Reset all settings to their default values and clear the current model.
      </p>
      <p>Make sure to save your work first!</p>
      <Button
        variant="outlined"
        color="error"
        onClick={() => {
          const ok = window.confirm(
            "Are you sure you want to clear ALL DATA (including the editors)?",
          );
          if (!ok) return;
          update({ type: "clear" });
          localStorage.clear();
          setTimeout(() => {
            window.location.reload();
          }, 25);
        }}
      >
        Clear all data
      </Button>
    </div>
  );
};

export default PersonalSettingsDialogue;
