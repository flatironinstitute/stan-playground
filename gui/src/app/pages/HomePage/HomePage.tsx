import { Splitter } from "@fi-sci/splitter";
import DataFileEditor from "@SpComponents/DataFileEditor";
import RunPanel from "@SpComponents/RunPanel";
import SamplerOutputView from "@SpComponents/SamplerOutputView";
import SamplingOptsPanel from "@SpComponents/SamplingOptsPanel";
import StanFileEditor from "@SpComponents/StanFileEditor";
import ProjectContextProvider, {
  ProjectContext,
} from "@SpCore/ProjectContextProvider";
import {
  modelHasUnsavedChanges,
  modelHasUnsavedDataFileChanges,
  ProjectKnownFiles,
  SamplingOpts,
} from "@SpCore/ProjectDataModel";
import LeftPanel from "@SpPages/LeftPanel";
import TopBar from "@SpPages/TopBar";
import useStanSampler, {
  useSamplerStatus,
} from "@SpStanSampler/useStanSampler";
import {
  FunctionComponent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Props = {
  width: number;
  height: number;
};

const HomePage: FunctionComponent<Props> = ({ width, height }) => {
  // NOTE: We should probably move the ProjectContextProvider up to the App or MainWindow
  // component; however this will wait on routing refactor since I don't want to add the `route`
  // item in those contexts in this PR
  return (
    <ProjectContextProvider>
      <HomePageChild width={width} height={height} />
    </ProjectContextProvider>
  );
};

const HomePageChild: FunctionComponent<Props> = ({ width, height }) => {
  const { data } = useContext(ProjectContext);

  const [compiledMainJsUrl, setCompiledMainJsUrl] = useState<string>("");

  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(
    determineShouldBeInitiallyCollapsed(width),
  );
  const expandedLeftPanelWidth = determineLeftPanelWidth(width); // what the width would be if expanded
  const leftPanelWidth = leftPanelCollapsed ? 20 : expandedLeftPanelWidth; // the actual width

  // We automatically collapse the panel if user has resized the window to be
  // too small but we only want to do this right when we cross the threshold,
  // not every time we resize by a pixel. Similar for expanding the panel when
  // we cross the threshold in the other direction.
  const lastShouldBeCollapsed = useRef(
    determineShouldBeInitiallyCollapsed(width),
  );
  useEffect(() => {
    const shouldBeCollapsed = determineShouldBeInitiallyCollapsed(width);
    if (shouldBeCollapsed !== lastShouldBeCollapsed.current) {
      lastShouldBeCollapsed.current = shouldBeCollapsed;
      setLeftPanelCollapsed(shouldBeCollapsed);
    }
  }, [width]);

  const topBarHeight = 22;

  useEffect(() => {
    document.title = "Stan Playground - Editing " + data.meta.title;
  }, [data.meta.title]);

  return (
    <div className="MainHomePage" style={{ width, height }}>
      <div
        className="top-bar TopBarPosition"
        style={{ width, height: topBarHeight }}
      >
        <TopBar title={data.meta.title} width={width} height={topBarHeight} />
      </div>
      <div
        className="left-panel LeftMenuPanelPosition"
        style={{
          top: topBarHeight + 2,
          width: leftPanelWidth,
          height: height - topBarHeight - 2,
        }}
      >
        <LeftPanel
          collapsed={leftPanelCollapsed}
          onSetCollapsed={setLeftPanelCollapsed}
          width={leftPanelWidth}
          height={height - topBarHeight - 2}
          hasUnsavedChanges={modelHasUnsavedChanges(data)}
        />
      </div>
      <div
        className="main-area MainAreaPosition"
        style={{
          left: leftPanelWidth,
          top: topBarHeight + 2,
          width: width - leftPanelWidth,
          height: height - topBarHeight - 2,
        }}
      >
        <Splitter
          width={width - leftPanelWidth}
          height={height - topBarHeight - 2}
          direction="horizontal"
          initialPosition={Math.min(800, (width - leftPanelWidth) / 2)}
        >
          <LeftView
            width={0}
            height={0}
            setCompiledMainJsUrl={setCompiledMainJsUrl}
          />
          <RightView
            width={0}
            height={0}
            compiledMainJsUrl={compiledMainJsUrl}
          />
        </Splitter>
      </div>
    </div>
  );
};

// the width of the left panel when it is expanded based on the overall width
const determineLeftPanelWidth = (width: number) => {
  const minWidth = 150;
  const maxWidth = 250;
  return Math.min(maxWidth, Math.max(minWidth, width / 4));
};

// whether the left panel should be collapsed initially based on the overall
// width
const determineShouldBeInitiallyCollapsed = (width: number) => {
  return width < 800;
};

type LeftViewProps = {
  width: number;
  height: number;
  setCompiledMainJsUrl: (url: string) => void;
};

const LeftView: FunctionComponent<LeftViewProps> = ({
  width,
  height,
  setCompiledMainJsUrl,
}) => {
  const { data, update } = useContext(ProjectContext);
  return (
    <Splitter
      direction="vertical"
      width={width}
      height={height}
      initialPosition={(2 * height) / 3}
    >
      <StanFileEditor
        width={0}
        height={0}
        fileName="main.stan"
        fileContent={data.stanFileContent}
        // this could be made more ergonomic?
        onSaveContent={() =>
          update({
            type: "commitFile",
            filename: ProjectKnownFiles.STANFILE,
          })
        }
        editedFileContent={data.ephemera.stanFileContent}
        setEditedFileContent={(content: string) =>
          update({
            type: "editFile",
            content,
            filename: ProjectKnownFiles.STANFILE,
          })
        }
        readOnly={false}
        setCompiledUrl={setCompiledMainJsUrl}
      />
      <DataFileEditor
        width={0}
        height={0}
        fileName="data.json"
        fileContent={data.dataFileContent}
        onSaveContent={() =>
          update({
            type: "commitFile",
            filename: ProjectKnownFiles.DATAFILE,
          })
        }
        editedFileContent={data.ephemera.dataFileContent}
        setEditedFileContent={(content: string) =>
          update({
            type: "editFile",
            content,
            filename: ProjectKnownFiles.DATAFILE,
          })
        }
        readOnly={false}
      />
    </Splitter>
  );
};

type RightViewProps = {
  width: number;
  height: number;
  compiledMainJsUrl?: string;
};

const RightView: FunctionComponent<RightViewProps> = ({
  width,
  height,
  compiledMainJsUrl,
}) => {
  const { data, update } = useContext(ProjectContext);
  const parsedData = useMemo(() => {
    try {
      return JSON.parse(data.dataFileContent);
    } catch (e) {
      return undefined;
    }
  }, [data.dataFileContent]);
  const samplingOptsPanelHeight = 160;
  const samplingOptsPanelWidth = Math.min(180, width / 2);

  const setSamplingOpts = useCallback(
    (opts: SamplingOpts) => {
      update({ type: "setSamplingOpts", opts });
    },
    [update],
  );

  const { sampler } = useStanSampler(compiledMainJsUrl);
  const { status: samplerStatus } = useSamplerStatus(sampler);
  const isSampling = samplerStatus === "sampling";
  return (
    <div className="Absolute" style={{ width, height }}>
      <div
        className="Absolute"
        style={{
          width: samplingOptsPanelWidth,
          height: samplingOptsPanelHeight,
        }}
      >
        <SamplingOptsPanel
          samplingOpts={data.samplingOpts}
          setSamplingOpts={!isSampling ? setSamplingOpts : undefined}
        />
      </div>
      <div
        className="Absolute RunPanelPosition"
        style={{
          left: samplingOptsPanelWidth,
          width: width - samplingOptsPanelWidth,
          height: samplingOptsPanelHeight,
        }}
      >
        <RunPanel
          width={width}
          height={samplingOptsPanelHeight}
          sampler={sampler}
          data={parsedData}
          dataIsSaved={!modelHasUnsavedDataFileChanges(data)}
          samplingOpts={data.samplingOpts}
        />
      </div>
      <div
        className="Absolute"
        style={{
          width,
          top: samplingOptsPanelHeight,
          height: height - samplingOptsPanelHeight,
        }}
      >
        {sampler && (
          <SamplerOutputView
            width={width}
            height={height - samplingOptsPanelHeight}
            sampler={sampler}
          />
        )}
      </div>
    </div>
  );
};

export default HomePage;
