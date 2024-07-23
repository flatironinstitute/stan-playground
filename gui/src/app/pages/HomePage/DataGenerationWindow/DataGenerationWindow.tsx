import { FunctionComponent, useCallback, useContext, useState } from "react";
import DataPyFileEditor from "./DataPyFileEditor";
import { ProjectContext } from "../../../Project/ProjectContextProvider";
import { ProjectKnownFiles } from "../../../Project/ProjectDataModel";
import { ConsoleOutputWindow } from "../AnalysisPyWindow/AnalysisPyWindow";
import DataRFileEditor from "./DataRFileEditor";
import { writeConsoleOutToDiv } from "app/pyodide/AnalysisPyFileEditor";
import { SplitDirection, Splitter } from "@SpComponents/Splitter";
import TabWidget from "@SpComponents/TabWidget";

type DataGenerationWindowProps = {
  // empty
};

type Language = "python" | "r";

const DataGenerationWindow: FunctionComponent<
  DataGenerationWindowProps
> = () => {
  return (
    <TabWidget labels={["Python", "R"]}>
      <DataGenerationChildWindow language="python" />
      <DataGenerationChildWindow language="r" />
    </TabWidget>
  );
};

type DataGenerationChildWindowProps = {
  language: Language;
};

const DataGenerationChildWindow: FunctionComponent<
  DataGenerationChildWindowProps
> = ({ language }) => {
  const { data, update } = useContext(ProjectContext);
  const [consoleOutputDiv, setConsoleOutputDiv] =
    useState<HTMLDivElement | null>(null);
  const handleSetData = useCallback(
    (data: any) => {
      update({
        type: "editFile",
        content: JSON.stringify(data, null, 2),
        filename: ProjectKnownFiles.DATAFILE,
      });
      update({ type: "commitFile", filename: ProjectKnownFiles.DATAFILE });
      // Use "stan-playground" prefix to distinguish from console output of the running code
      writeConsoleOutToDiv(
        consoleOutputDiv,
        "[stan-playground] Data updated",
        "stdout",
      );
    },
    [update, consoleOutputDiv],
  );
  const EditorComponent =
    language === "python" ? DataPyFileEditor : DataRFileEditor;
  return (
    <Splitter direction={SplitDirection.Vertical} initialSizes={[75, 25]}>
      <EditorComponent
        fileName={language === "python" ? "data.py" : "data.r"}
        fileContent={
          language === "python" ? data.dataPyFileContent : data.dataRFileContent
        }
        onSaveContent={() => {
          update({
            type: "commitFile",
            filename:
              language === "python"
                ? ProjectKnownFiles.DATAPYFILE
                : ProjectKnownFiles.DATARFILE,
          });
        }}
        editedFileContent={
          language === "python"
            ? data.ephemera.dataPyFileContent
            : data.ephemera.dataRFileContent
        }
        setEditedFileContent={(content) => {
          update({
            type: "editFile",
            content,
            filename:
              language === "python"
                ? ProjectKnownFiles.DATAPYFILE
                : ProjectKnownFiles.DATARFILE,
          });
        }}
        readOnly={false}
        setData={handleSetData}
        outputDiv={consoleOutputDiv}
      />
      <ConsoleOutputWindow onDivElement={setConsoleOutputDiv} />
    </Splitter>
  );
};

export default DataGenerationWindow;
