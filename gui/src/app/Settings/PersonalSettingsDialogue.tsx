import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";

import { useContext } from "react";

import { ProjectContext } from "@SpCore/ProjectContextProvider";
import { UserSettingsContext } from "./UserSettings";

const PersonalSettingsDialogue = () => {
  const { update } = useContext(ProjectContext);
  const { pedantic, togglePedantic, theme, toggleTheme } =
    useContext(UserSettingsContext);

  return (
    <div className="dialogWrapper">
      <FormControl>
        <FormLabel id="appearance-settings">
          <h3>Appearance</h3>
        </FormLabel>
        <FormControlLabel
          value="public"
          control={<Switch onClick={toggleTheme} checked={theme == "dark"} />}
          label="Enable dark mode"
          title="Enable dark mode"
          aria-label="enable dark mode"
        />
        <FormHelperText>
          Dark mode makes the background of the app dark and changes other
          colors to be easier on the eyes. It does <em>not</em> affect items
          like the plots produced by the analysis scripts.
        </FormHelperText>
      </FormControl>

      <FormControl>
        <FormLabel id="warnings-settings">
          <h3>Warnings</h3>
        </FormLabel>
        <FormControlLabel
          value="public"
          control={<Switch onClick={togglePedantic} checked={pedantic} />}
          label="Enable Pedantic mode"
          aria-label="enable pedantic mode"
          title="Enable Pedantic mode"
        />
        <FormHelperText>
          <a
            href="https://mc-stan.org/docs/stan-users-guide/using-stanc.html#pedantic-mode"
            target="_blank"
            rel="noreferrer"
          >
            &quot;Pedantic mode&quot;
          </a>{" "}
          is an option in the Stan compiler to enable additional warnings. These
          can be instructive, but they can also lead to false positives. Be
          prepared to take them with a grain of salt.
        </FormHelperText>
      </FormControl>

      <FormControl>
        <FormLabel id="reset-settings">
          <h3>Reset to defaults</h3>
        </FormLabel>
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
        <FormHelperText>
          Reset all settings to their default values and clear the current
          model. <br />
          Make sure to download or export your work first!
        </FormHelperText>
      </FormControl>
    </div>
  );
};

export default PersonalSettingsDialogue;
