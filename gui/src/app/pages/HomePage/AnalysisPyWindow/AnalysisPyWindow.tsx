import { FunctionComponent, useContext, useMemo, useState } from "react";
import { ProjectContext } from "../../../Project/ProjectContextProvider";
import { ProjectKnownFiles } from "../../../Project/ProjectDataModel";
import AnalysisPyFileEditor from "../../../pyodide/AnalysisPyFileEditor";
import { SplitDirection, Splitter } from "@SpComponents/Splitter";
import { StanRun } from "@SpStanSampler/useStanSampler";

type AnalysisPyWindowProps = {
  latestRun: StanRun;
};

const AnalysisPyWindow: FunctionComponent<AnalysisPyWindowProps> = ({
  latestRun,
}) => {
  // TODO make useRef
  const [imageOutputDiv, setImageOutputDiv] = useState<HTMLDivElement | null>(
    null,
  );
  return (
    <Splitter>
      <LeftPane imageOutputDiv={imageOutputDiv} latestRun={latestRun} />
      <ImageOutputWindow onDivElement={setImageOutputDiv} />
    </Splitter>
  );
};

type LeftPaneProps = {
  imageOutputDiv: HTMLDivElement | null;
  latestRun: StanRun;
};

export type GlobalDataForAnalysisPy = {
  draws: number[][];
  paramNames: string[];
  numChains: number;
};

const LeftPane: FunctionComponent<LeftPaneProps> = ({
  imageOutputDiv,
  latestRun,
}) => {
  // TODO make useRef
  const [consoleOutputDiv, setConsoleOutputDiv] =
    useState<HTMLDivElement | null>(null);
  const { data, update } = useContext(ProjectContext);
  const { draws, paramNames, samplingOpts } = latestRun;
  const numChains = samplingOpts?.num_chains;
  const spData = useMemo(() => {
    if (draws && numChains && paramNames) {
      return {
        draws,
        paramNames,
        numChains,
      };
    } else {
      return undefined;
    }
  }, [draws, paramNames, numChains]);
  return (
    <Splitter direction={SplitDirection.Vertical} initialSizes={[60, 40]}>
      <AnalysisPyFileEditor
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
        spData={spData}
      />
      <ConsoleOutputWindow onDivElement={setConsoleOutputDiv} />
    </Splitter>
  );
};

type ConsoleOutputWindowProps = {
  onDivElement: (div: HTMLDivElement) => void;
};

export const ConsoleOutputWindow: FunctionComponent<
  ConsoleOutputWindowProps
> = ({ onDivElement }) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflowY: "auto",
      }}
      ref={onDivElement}
    />
  );
};

type ImageOutputWindowProps = {
  onDivElement: (div: HTMLDivElement) => void;
};

const ImageOutputWindow: FunctionComponent<ImageOutputWindowProps> = ({
  onDivElement,
}) => {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        overflowY: "auto",
      }}
      ref={onDivElement}
    />
  );
};

export default AnalysisPyWindow;
