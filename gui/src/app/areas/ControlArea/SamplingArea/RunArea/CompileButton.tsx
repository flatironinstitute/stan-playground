import { FunctionComponent, use, useMemo } from "react";

import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";

import { CompileContext } from "@SpCore/Compilation/CompileContextProvider";
import { ProjectContext } from "@SpCore/Project/ProjectContextProvider";

const CompileButton: FunctionComponent = () => {
  const { data: projectData } = use(ProjectContext);

  const { compile, compileStatus, validSyntax, isConnected } =
    use(CompileContext);

  const modelIsPresent = useMemo(() => {
    return projectData.stanFileContent.trim();
  }, [projectData.stanFileContent]);

  const modelIsSaved = useMemo(() => {
    return projectData.stanFileContent === projectData.ephemera.stanFileContent;
  }, [projectData.ephemera.stanFileContent, projectData.stanFileContent]);

  const tooltip = useMemo(() => {
    if (!validSyntax) return "Syntax error";
    if (!isConnected) return "Not connected to compilation server";
    if (!modelIsPresent) return "No model to compile";
    if (!modelIsSaved) return "Model has unsaved changes";
    return "";
  }, [isConnected, modelIsPresent, modelIsSaved, validSyntax]);

  const compileDiv = (
    <div>
      <Tooltip title={tooltip}>
        <span>
          <Button
            variant="contained"
            onClick={compile}
            disabled={tooltip != ""}
          >
            compile model
          </Button>
        </span>
      </Tooltip>
    </div>
  );

  const compilingDiv = (
    <div>
      <CircularProgress />
    </div>
  );

  return ["preparing", "compiling"].includes(compileStatus)
    ? compilingDiv
    : compileDiv;
};

export default CompileButton;
