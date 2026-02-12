import { useCallback, use, useRef, useState } from "react";
import {
  DataSource,
  ProjectKnownFiles,
} from "@SpCore/Project/ProjectDataModel";
import { writeConsoleOutToDiv } from "@SpCore/Scripting/OutputDivUtils";
import { InterpreterStatus } from "@SpCore/Scripting/InterpreterTypes";
import { ProjectContext } from "@SpCore/Project/ProjectContextProvider";

// A custom hook to share logic between the Python and R data generation windows
// This contains the output div ref, the interpreter state, and the callback to update the data.
const useDataGenState = (source: "python" | "r") => {
  const [status, setStatus] = useState<InterpreterStatus>("idle");
  const consoleRef = useRef<HTMLDivElement | null>(null);

  const {
    update,
    data: { extraDataFiles: files },
  } = use(ProjectContext);

  const onData = useCallback(
    (newData: unknown) => {
      update({
        type: "generateData",
        content: JSON.stringify(newData, null, 2),
        dataSource:
          source === "python"
            ? DataSource.GENERATED_BY_PYTHON
            : DataSource.GENERATED_BY_R,
      });
      // Use "stan-playground" prefix to distinguish from console output of the running code
      writeConsoleOutToDiv(
        consoleRef,
        "[stan-playground] Data updated",
        "stdout",
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- source intentionally excluded
    [update, consoleRef],
  );

  const onStanCode = useCallback(
    (newCode: string) => {
      update({
        type: "editFile",
        filename: ProjectKnownFiles.STANFILE,
        content: newCode,
      });
      update({ type: "commitFile", filename: ProjectKnownFiles.STANFILE });
      writeConsoleOutToDiv(
        consoleRef,
        "[stan-playground] Stan code updated",
        "stdout",
      );
    },
    [update, consoleRef],
  );

  return { consoleRef, status, onStatus: setStatus, onData, onStanCode, files };
};

export default useDataGenState;
