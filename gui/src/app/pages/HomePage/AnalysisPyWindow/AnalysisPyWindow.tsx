import {
  FunctionComponent,
  RefObject,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import AnalysisPyFileEditor from "../../../pyodide/AnalysisPyFileEditor";
import { SplitDirection, Splitter } from "@SpComponents/Splitter";
import { StanRun } from "@SpStanSampler/useStanSampler";
import { ProjectContext } from "@SpCore/ProjectContextProvider";
import { ProjectKnownFiles } from "@SpCore/ProjectDataModel";

type AnalysisPyWindowProps = {
  latestRun: StanRun;
};

const AnalysisPyWindow: FunctionComponent<AnalysisPyWindowProps> = ({
  latestRun,
}) => {
  const imagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (imagesRef.current) {
      imagesRef.current.innerHTML = "";
    }
  }, [latestRun.draws]);

  return (
    <Splitter>
      <LeftPane imagesRef={imagesRef} latestRun={latestRun} />
      <ImageOutputWindow imagesRef={imagesRef} />
    </Splitter>
  );
};

type LeftPaneProps = {
  imagesRef: RefObject<HTMLDivElement>;
  latestRun: StanRun;
};

export type GlobalDataForAnalysisPy = {
  draws: number[][];
  paramNames: string[];
  numChains: number;
};

const LeftPane: FunctionComponent<LeftPaneProps> = ({
  imagesRef,
  latestRun,
}) => {
  const consoleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.innerHTML = "";
    }
  }, [latestRun.draws]);

  const { data, update } = useContext(ProjectContext);
  const { draws, paramNames, samplingOpts, status } = latestRun;
  const numChains = samplingOpts?.num_chains;
  const spData = useMemo(() => {
    if (status === "completed" && draws && numChains && paramNames) {
      return {
        draws,
        paramNames,
        numChains,
      };
    } else {
      return undefined;
    }
  }, [status, draws, numChains, paramNames]);
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
        consoleRef={consoleRef}
        imagesRef={imagesRef}
        readOnly={false}
        spData={spData}
      />
      <ConsoleOutputWindow consoleRef={consoleRef} />
    </Splitter>
  );
};

type ConsoleOutputWindowProps = {
  consoleRef: RefObject<HTMLDivElement>;
};

export const ConsoleOutputWindow: FunctionComponent<
  ConsoleOutputWindowProps
> = ({ consoleRef }) => {
  return <div className="ConsoleOutputArea" ref={consoleRef} />;
};

type ImageOutputWindowProps = {
  imagesRef: RefObject<HTMLDivElement>;
};

const ImageOutputWindow: FunctionComponent<ImageOutputWindowProps> = ({
  imagesRef,
}) => {
  return <div className="ImageOutputArea" ref={imagesRef} />;
};

export default AnalysisPyWindow;
