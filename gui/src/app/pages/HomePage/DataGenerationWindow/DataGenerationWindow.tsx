import { FunctionComponent, useCallback, useContext, useRef } from "react";
import DataPyFileEditor from "./DataPyFileEditor";
import DataRFileEditor from "./DataRFileEditor";
import { writeConsoleOutToDiv } from "@SpPyodide/AnalysisPyFileEditor";
import { SplitDirection, Splitter } from "@SpComponents/Splitter";
import TabWidget from "@SpComponents/TabWidget";
import { ProjectContext } from "@SpCore/ProjectContextProvider";
import { ProjectKnownFiles } from "@SpCore/ProjectDataModel";
import { ConsoleOutputWindow } from "@SpPages/AnalysisPyWindow/AnalysisPyWindow";

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

  const consoleRef = useRef<HTMLDivElement | null>(null);

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
        consoleRef,
        "[stan-playground] Data updated",
        "stdout",
      );
    },
    [update, consoleRef],
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
        outputDiv={consoleRef}
      />
      <ConsoleOutputWindow consoleRef={consoleRef} />
    </Splitter>
  );
};

export default DataGenerationWindow;
