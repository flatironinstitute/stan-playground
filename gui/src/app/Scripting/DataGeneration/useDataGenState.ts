import { useCallback, use, useRef, useState } from "react";
import { DataSource } from "@SpCore/ProjectDataModel";
import { writeConsoleOutToDiv } from "@SpScripting/OutputDivUtils";
import { InterpreterStatus } from "@SpScripting/InterpreterTypes";
import { ProjectContext } from "@SpCore/ProjectContextProvider";

// A custom hook to share logic between the Python and R data generation windows
// This contains the output div ref, the interpreter state, and the callback to update the data.
const useDataGenState = (source: "python" | "r") => {
  const [status, setStatus] = useState<InterpreterStatus>("idle");
  const consoleRef = useRef<HTMLDivElement | null>(null);

  const { update } = use(ProjectContext);

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
    [update, consoleRef],
  );

  return { consoleRef, status, onStatus: setStatus, onData };
};

export default useDataGenState;
