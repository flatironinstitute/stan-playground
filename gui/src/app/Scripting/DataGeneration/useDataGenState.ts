import { useCallback, useContext, useRef, useState } from "react";
import { ProjectKnownFiles } from "@SpCore/ProjectDataModel";
import { writeConsoleOutToDiv } from "@SpScripting/ScriptEditor";
import { InterpreterStatus } from "@SpScripting/InterpreterTypes";
import { ProjectContext } from "@SpCore/ProjectContextProvider";

const useDataGenState = () => {
  const [status, setStatus] = useState<InterpreterStatus>("idle");
  const consoleRef = useRef<HTMLDivElement>(null);

  const { data, update } = useContext(ProjectContext);

  // we don't want the callback to force itself to re-render when data is set
  const lastData = useRef(data.dataFileContent);
  const onData = useCallback(
    (newData: unknown) => {
      const dataJson = JSON.stringify(newData, null, 2);

      if (dataJson !== lastData.current) {
        lastData.current = dataJson;
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
    [update, consoleRef],
  );

  return { consoleRef, status, onStatus: setStatus, onData };
};

export default useDataGenState;
