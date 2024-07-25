import { FunctionComponent, useCallback, useContext, useRef } from "react";
import DataPyFileEditor from "./DataPyFileEditor";
import { ConsoleOutputWindow } from "../AnalysisPyWindow/AnalysisPyWindow";
import DataRFileEditor from "./DataRFileEditor";
import { writeConsoleOutToDiv } from "@SpPyodide/AnalysisPyFileEditor";
import { SplitDirection, Splitter } from "@SpComponents/Splitter";
import TabWidget from "@SpComponents/TabWidget";
import { ProjectKnownFiles } from "@SpCore/ProjectDataModel";
import { ProjectContext } from "@SpCore/ProjectContextProvider";
import { FileNames } from "@SpCore/FileMapping";

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

  const EditorComponent =
    language === "python" ? DataPyFileEditor : DataRFileEditor;
  return (
    <Splitter direction={SplitDirection.Vertical} initialSizes={[75, 25]}>
      <EditorComponent
        fileName={
          language === "python" ? FileNames.DATAPYFILE : FileNames.DATARFILE
        }
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
