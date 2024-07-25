import {
  FunctionComponent,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import ScriptEditor, { writeConsoleOutToDiv } from "app/Scripting/ScriptEditor";
import { FileNames } from "@SpCore/FileMapping";
import { ProjectKnownFiles } from "@SpCore/ProjectDataModel";
import { ProjectContext } from "@SpCore/ProjectContextProvider";
import { InterpreterStatus } from "../InterpreterTypes";
import runR from "../runR";

type Props = {
  // empty
};

const DataRWindow: FunctionComponent<Props> = () => {
  const [status, setStatus] = useState<InterpreterStatus>("idle");
  const consoleRef = useRef<HTMLDivElement>(null);
  const { data, update } = useContext(ProjectContext);

  const setData = useCallback(
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

  const handleRun = useCallback(
    async (code: string) => {
      await runR({ code, consoleRef, setStatus, setData });
    },
    [setData],
  );

  const handleHelp = useCallback(() => {
    alert(
      'Write a Rthon script to assign data to the "data" variable and then click "Run" to generate data.',
    );
  }, []);

  const contentOnEmpty = useMemo(() => {
    const spanElement = document.createElement("span");
    const t1 = document.createTextNode(
      "Define a dictionary called data to update the data.json. ",
    );
    const a1 = document.createElement("a");
    a1.onclick = () => {
      update({
        type: "editFile",
        filename: ProjectKnownFiles.DATARFILE,
        content: dataRTemplate,
      });
    };
    a1.textContent = "Click here to generate an example";
    spanElement.appendChild(t1);
    spanElement.appendChild(a1);
    return spanElement;
  }, [update]);

  return (
    <ScriptEditor
      filename={FileNames.DATARFILE}
      dataKey={ProjectKnownFiles.DATARFILE}
      language="r"
      status={status}
      onRun={handleRun}
      runnable={true}
      notRunnableReason=""
      onHelp={handleHelp}
      consoleRef={consoleRef}
      contentOnEmpty={contentOnEmpty}
    />
  );
};

const dataRTemplate = `data = {
  "a": [1, 2, 3]
}`;

export default DataRWindow;
