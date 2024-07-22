import { FunctionComponent, useCallback, useContext, useState } from "react";
import TabWidget from "../../../TabWidget/TabWidget";
import { Splitter } from "@fi-sci/splitter";
import DataPyFileEditor from "./DataPyFileEditor";
import { ProjectContext } from "../../../Project/ProjectContextProvider";
import { ProjectKnownFiles } from "../../../Project/ProjectDataModel";
import { ConsoleOutputWindow } from "../AnalysisPyWindow/AnalysisPyWindow";
import DataRFileEditor from "./DataRFileEditor";
import { writeConsoleOutToDiv } from "app/pyodide/AnalysisPyFileEditor";

type DataGenerationWindowProps = {
  width: number;
  height: number;
};

type Language = "python" | "r";

const tabs = [
  {
    id: "python",
    label: "Python",
    closeable: false,
  },
  {
    id: "r",
    label: "R",
    closeable: false,
  },
];

const DataGenerationWindow: FunctionComponent<DataGenerationWindowProps> = ({
  width,
  height,
}) => {
  const [currentTabId, setCurrentTabId] = useState<string>("python");
  return (
    <TabWidget
      width={width}
      height={height}
      tabs={tabs}
      currentTabId={currentTabId}
      setCurrentTabId={setCurrentTabId}
    >
      <DataGenerationChildWindow
        key="python"
        width={0}
        height={0}
        language="python"
      />
      <DataGenerationChildWindow key="r" width={0} height={0} language="r" />
    </TabWidget>
  );
};

type DataGenerationChildWindowProps = {
  width: number;
  height: number;
  language: Language;
};

const DataGenerationChildWindow: FunctionComponent<
  DataGenerationChildWindowProps
> = ({ width, height, language }) => {
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
    <Splitter
      width={width}
      height={height}
      direction="vertical"
      initialPosition={(3 * height) / 4}
    >
      <EditorComponent
        width={0}
        height={0}
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
      <ConsoleOutputWindow
        width={0}
        height={0}
        onDivElement={setConsoleOutputDiv}
      />
    </Splitter>
  );
};

export default DataGenerationWindow;
