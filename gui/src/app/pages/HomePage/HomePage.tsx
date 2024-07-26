import Box from "@mui/material/Box";
import styled from "@mui/material/styles/styled";
import useMediaQuery from "@mui/material/useMediaQuery";
import { GutterTheme, SplitDirection, Splitter } from "@SpComponents/Splitter";
import StanFileEditor from "@SpComponents/StanFileEditor";
import { ProjectContext } from "@SpCore/ProjectContextProvider";
import {
  modelHasUnsavedChanges,
  ProjectKnownFiles,
} from "@SpCore/ProjectDataModel";
import Sidebar, { drawerWidth } from "@SpPages/Sidebar";
import TopBar from "@SpPages/TopBar";
import {
  FunctionComponent,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import TabWidget from "@SpComponents/TabWidget";
import SamplingWindow from "./SamplingWindow/SamplingWindow";
import { FileNames } from "@SpCore/FileMapping";
import DataRWindow from "@SpScripting/DataGeneration/DataRWindow";
import DataPyWindow from "@SpScripting/DataGeneration/DataPyWindow";
import TextEditor from "@SpComponents/TextEditor";

type Props = {
  //
};

const HomePage: FunctionComponent<Props> = () => {
  const { data } = useContext(ProjectContext);

  const [compiledMainJsUrl, setCompiledMainJsUrl] = useState<string>("");

  const smallScreen = useMediaQuery("(max-width:600px)");

  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(smallScreen);

  // We automatically collapse the panel if user has resized the window to be
  // too small but we only want to do this right when we cross the threshold,
  // not every time we resize by a pixel. Similar for expanding the panel when
  // we cross the threshold in the other direction.
  const lastShouldBeCollapsed = useRef(smallScreen);
  useEffect(() => {
    if (smallScreen !== lastShouldBeCollapsed.current) {
      lastShouldBeCollapsed.current = smallScreen;
      setLeftPanelCollapsed(smallScreen);
    }
  }, [smallScreen]);

  useEffect(() => {
    document.title = "Stan Playground - Editing " + data.meta.title;
  }, [data.meta.title]);

  return (
    <Box display="flex" flexDirection="column" height="100%">
      <TopBar title={data.meta.title} onSetCollapsed={setLeftPanelCollapsed} />

      <Sidebar
        collapsed={leftPanelCollapsed}
        hasUnsavedChanges={modelHasUnsavedChanges(data)}
      />

      <MovingBox open={leftPanelCollapsed} flex="1" minHeight="0">
        <Splitter
          minWidths={[80, 120]}
          direction={SplitDirection.Horizontal}
          gutterTheme={GutterTheme.Light}
        >
          <LeftView setCompiledMainJsUrl={setCompiledMainJsUrl} />
          <RightView compiledMainJsUrl={compiledMainJsUrl} />
        </Splitter>
      </MovingBox>
    </Box>
  );
};

type RightViewProps = {
  compiledMainJsUrl: string;
};

const RightView: FunctionComponent<RightViewProps> = ({
  compiledMainJsUrl,
}) => {
  return (
    <TabWidget labels={["Sampling", "Data Generation"]}>
      <SamplingWindow compiledMainJsUrl={compiledMainJsUrl} />
      <TabWidget labels={["Python", "R"]}>
        <DataPyWindow />
        <DataRWindow />
      </TabWidget>
    </TabWidget>
  );
};

type LeftViewProps = {
  setCompiledMainJsUrl: (url: string) => void;
};

const LeftView: FunctionComponent<LeftViewProps> = ({
  setCompiledMainJsUrl,
}) => {
  const { data, update } = useContext(ProjectContext);
  return (
    <Splitter
      direction={SplitDirection.Vertical}
      gutterTheme={GutterTheme.Light}
    >
      <StanFileEditor
        fileName={FileNames.STANFILE}
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
      <TextEditor
        language="json"
        label={FileNames.DATAFILE}
        text={data.dataFileContent}
        onSaveText={() =>
          update({
            type: "commitFile",
            filename: ProjectKnownFiles.DATAFILE,
          })
        }
        editedText={data.ephemera.dataFileContent}
        onSetEditedText={(content: string) =>
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

// adapted from https://mui.com/material-ui/react-drawer/#persistent-drawer
const MovingBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== "open",
})<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  transition: theme.transitions.create("padding", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  paddingLeft: `${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create("padding", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    paddingLeft: 0,
  }),
}));

export default HomePage;
