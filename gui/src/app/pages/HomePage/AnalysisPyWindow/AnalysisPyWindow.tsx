import { Splitter } from "@fi-sci/splitter";
import { FunctionComponent, useContext, useState } from "react";
import AnalysisPyFileEditor from "../../../pyodide/AnalysisPyFileEditor";
import { ProjectContext } from "../../../Project/ProjectContextProvider";
import { ProjectKnownFiles } from "../../../Project/ProjectDataModel";

type AnalysisPyWindowProps = {
  width: number;
  height: number;
};

const AnalysisPyWindow: FunctionComponent<AnalysisPyWindowProps> = ({
  width,
  height,
}) => {
  const [imageOutputDiv, setImageOutputDiv] = useState<HTMLDivElement | null>(
    null,
  );
  return (
    <Splitter
      direction="horizontal"
      width={width}
      height={height}
      initialPosition={width / 2}
    >
      <LeftPane width={0} height={0} imageOutputDiv={imageOutputDiv} />
      <RightPane width={0} height={0} onImageOutputDiv={setImageOutputDiv} />
    </Splitter>
  );
};

type LeftPaneProps = {
  width: number;
  height: number;
  imageOutputDiv: HTMLDivElement | null;
};

const LeftPane: FunctionComponent<LeftPaneProps> = ({
  width,
  height,
  imageOutputDiv,
}) => {
  const [consoleOutputDiv, setConsoleOutputDiv] =
    useState<HTMLDivElement | null>(null);
  const { data, update } = useContext(ProjectContext);
  console.log('---- data', data)
  return (
    <Splitter
      direction="vertical"
      width={width}
      height={height}
      initialPosition={(3 * height) / 5}
    >
      <AnalysisPyFileEditor
        width={0}
        height={0}
        fileName="analysis.py"
        fileContent={data.analysisPyFileContent}
        editedFileContent={data.ephemera.analysisPyFileContent}
        setEditedFileContent={(content) => {
          update({
            type: "editFile",
            content,
            filename: ProjectKnownFiles.ANALYSISPYFILE,
          });
        }}
        onSaveContent={() => {
          update({
            type: "commitFile",
            filename: ProjectKnownFiles.ANALYSISPYFILE,
          });
        }}
        consoleOutputDiv={consoleOutputDiv}
        imageOutputDiv={imageOutputDiv}
        readOnly={false}
      />
      <ConsoleOutputWindow
        width={0}
        height={0}
        onDivElement={setConsoleOutputDiv}
      />
    </Splitter>
  );
};

type ConsoleOutputWindowProps = {
  width: number;
  height: number;
  onDivElement: (div: HTMLDivElement) => void;
};

const ConsoleOutputWindow: FunctionComponent<ConsoleOutputWindowProps> = ({
  width,
  height,
  onDivElement,
}) => {
  return (
    <div
      style={{ position: "absolute", width, height, overflowY: "auto" }}
      ref={onDivElement}
    />
  );
};

type ImageOutputWindowProps = {
  width: number;
  height: number;
  onDivElement: (div: HTMLDivElement) => void;
};

const ImageOutputWindow: FunctionComponent<ImageOutputWindowProps> = ({
  width,
  height,
  onDivElement,
}) => {
  return (
    <div
      style={{ position: "absolute", width, height, overflowY: "auto" }}
      ref={onDivElement}
    />
  );
};

type RightPaneProps = {
  width: number;
  height: number;
  onImageOutputDiv: (div: HTMLDivElement) => void;
};

const RightPane: FunctionComponent<RightPaneProps> = ({
  width,
  height,
  onImageOutputDiv,
}) => {
  return (
    <ImageOutputWindow
      width={width}
      height={height}
      onDivElement={onImageOutputDiv}
    />
  );
};

export default AnalysisPyWindow;
