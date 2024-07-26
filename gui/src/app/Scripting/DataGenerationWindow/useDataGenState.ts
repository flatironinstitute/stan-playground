import { ProjectKnownFiles } from "@SpCore/ProjectDataModel";
import { writeConsoleOutToDiv } from "../ScriptEditor";
import { useCallback, useContext, useRef, useState } from "react";
import { InterpreterStatus } from "../InterpreterTypes";
import { ProjectContext } from "@SpCore/ProjectContextProvider";

const useDataGenState = () => {
  const [status, setStatus] = useState<InterpreterStatus>("idle");
  const consoleRef = useRef<HTMLDivElement>(null);

  const { data, update } = useContext(ProjectContext);

  const onData = useCallback(
    (newData: unknown) => {
      const dataJson = JSON.stringify(newData, null, 2);

      if (dataJson !== data.dataFileContent) {
        update({
          type: "editFile",
          content: dataJson,
          filename: ProjectKnownFiles.DATAFILE,
        });
        update({ type: "commitFile", filename: ProjectKnownFiles.DATAFILE });
        // Use "stan-playground" prefix to distinguish from console output of the running code
        writeConsoleOutToDiv(
          consoleRef,
          "[stan-playground] Data updated",
          "stdout",
        );
      } else {
        writeConsoleOutToDiv(
          consoleRef,
          "[stan-playground] Data unchanged",
          "stdout",
        );
      }
    },
    [update, consoleRef, data.dataFileContent],
  );

  return { consoleRef, status, onStatus: setStatus, onData };
};

export default useDataGenState;
