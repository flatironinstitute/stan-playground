import { Splitter } from "@fi-sci/splitter";
import { FunctionComponent, useContext, useMemo, useState } from "react";
import { ProjectContext } from "../../../Project/ProjectContextProvider";
import { ProjectKnownFiles } from "../../../Project/ProjectDataModel";
import StanSampler from "../../../StanSampler/StanSampler";
import { useSamplerOutput } from "../../../StanSampler/useStanSampler";
import AnalysisPyFileEditor from "../../../pyodide/AnalysisPyFileEditor";

type AnalysisPyWindowProps = {
  width: number;
  height: number;
  stanSampler: StanSampler | null;
};

const AnalysisPyWindow: FunctionComponent<AnalysisPyWindowProps> = ({
  width,
  height,
  stanSampler,
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
      <LeftPane
        width={0}
        height={0}
        imageOutputDiv={imageOutputDiv}
        stanSampler={stanSampler}
      />
      <RightPane width={0} height={0} onImageOutputDiv={setImageOutputDiv} />
    </Splitter>
  );
};

type LeftPaneProps = {
  width: number;
  height: number;
  imageOutputDiv: HTMLDivElement | null;
  stanSampler: StanSampler | null;
};

const LeftPane: FunctionComponent<LeftPaneProps> = ({
  width,
  height,
  imageOutputDiv,
  stanSampler,
}) => {
  const [consoleOutputDiv, setConsoleOutputDiv] =
    useState<HTMLDivElement | null>(null);
  const { data, update } = useContext(ProjectContext);
  const { draws, paramNames, numChains } = useSamplerOutput(
    stanSampler || undefined,
  );
  const { globalData, scriptHeader } = useMemo(() => {
    if (draws) {
      return {
        globalData: {
          _sp_sampling: {
            draws: transpose(draws),
            paramNames,
            numChains,
          },
        },
        scriptHeader: getScriptHeaderForNonemptyDraws(),
      };
    } else {
      return {
        globalData: {},
        scriptHeader: getScriptHeaderForEmptyDraws(),
      };
    }
  }, [draws, paramNames, numChains]);
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
        globalData={globalData}
        scriptHeader={scriptHeader}
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

const getScriptHeaderForEmptyDraws = () => {
  return `
raise Exception("You must run the sampler before executing the analysis script.")
`;
//   return `
// class _SPSampling:
//   def __init__(self):
//     self.draws = []
//     self.parameter_names = []
//     self.num_chains = 0
// sp_sampling = _SPSampling()
// `;
};

const getScriptHeaderForNonemptyDraws = () => {
  return `
class _SPSampling:
  def __init__(self):
    self.draws = _sp_sampling["draws"]
    self.parameter_names = _sp_sampling["paramNames"]
    self.num_chains = _sp_sampling["numChains"]
sp_sampling = _SPSampling()
`;
};

const transpose = (matrix: number[][]) => {
  return matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]));
};

export default AnalysisPyWindow;
