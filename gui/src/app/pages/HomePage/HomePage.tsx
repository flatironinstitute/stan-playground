import { Split } from "@geoffcox/react-splitter";
import Box from "@mui/material/Box";
import styled from "@mui/material/styles/styled";
import useMediaQuery from "@mui/material/useMediaQuery";
import StanFileEditor from "@SpComponents/StanFileEditor";
import TabWidget from "@SpComponents/TabWidget";
import TextEditor from "@SpComponents/TextEditor";
import { ColorOptions, ToolbarItem } from "@SpComponents/ToolBar";
import { FileNames } from "@SpCore/FileMapping";
import { ProjectContext } from "@SpCore/ProjectContextProvider";
import {
  DataSource,
  modelHasUnsavedChanges,
  ProjectKnownFiles,
} from "@SpCore/ProjectDataModel";
import Sidebar, { drawerWidth } from "@SpPages/Sidebar";
import TopBar from "@SpPages/TopBar";
import DataPyWindow from "@SpScripting/DataGeneration/DataPyWindow";
import DataRWindow from "@SpScripting/DataGeneration/DataRWindow";
import { unreachable } from "@SpUtil/unreachable";
import {
  FunctionComponent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import SamplingWindow from "./SamplingWindow/SamplingWindow";

type Props = {
  //
};

const HomePage: FunctionComponent<Props> = () => {
  const { data } = useContext(ProjectContext);

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
        <Split minPrimarySize="80px" minSecondarySize="120px">
          <LeftView />
          <RightView />
        </Split>
      </MovingBox>
    </Box>
  );
};

type RightViewProps = {
  // none
};

const RightView: FunctionComponent<RightViewProps> = () => {
  return (
    <TabWidget labels={["Sampling", "Data Generation"]}>
      <SamplingWindow />
      <TabWidget labels={["Python", "R"]}>
        <DataPyWindow />
        <DataRWindow />
      </TabWidget>
    </TabWidget>
  );
};

type LeftViewProps = {
  // none
};

const LeftView: FunctionComponent<LeftViewProps> = () => {
  const { data, update } = useContext(ProjectContext);

  return (
    <Split horizontal>
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
      />
      <DataEditor />
    </Split>
  );
};

const DataEditor: FunctionComponent<unknown> = () => {
  const { data, update } = useContext(ProjectContext);

  const dataIsEdited = useMemo(() => {
    return data.dataFileContent !== data.ephemera.dataFileContent;
  }, [data.dataFileContent, data.ephemera.dataFileContent]);

  const dataSourceDesc: undefined | { msg: string; color: ColorOptions } =
    useMemo(() => {
      if (dataIsEdited) return undefined;

      switch (data.meta.dataSource) {
        case undefined: {
          return undefined;
        }
        case DataSource.GENERATED_BY_PYTHON: {
          return { msg: "data.py", color: "info.main" };
        }
        case DataSource.GENERATED_BY_R: {
          return { msg: "data.R", color: "info.main" };
        }
        case DataSource.GENERATED_BY_STALE_PYTHON: {
          return { msg: "a prior version of data.py.", color: "warning.main" };
        }
        case DataSource.GENERATED_BY_STALE_R: {
          return { msg: "a prior version of data.R.", color: "warning.main" };
        }
        default:
          return unreachable(data.meta.dataSource);
      }
    }, [dataIsEdited, data.meta.dataSource]);

  const dataMessage: ToolbarItem[] = useMemo(() => {
    if (dataSourceDesc === undefined) {
      return [];
    } else {
      return [
        {
          type: "text",
          label: `Data generated by ${dataSourceDesc.msg}`,
          color: dataSourceDesc.color,
        },
      ];
    }
  }, [dataSourceDesc]);

  const onSetEditedText = useCallback(
    (content: string) => {
      update({
        type: "editFile",
        content,
        filename: ProjectKnownFiles.DATAFILE,
      });
    },
    [update],
  );

  const onSaveText = useCallback(() => {
    update({
      type: "commitFile",
      filename: ProjectKnownFiles.DATAFILE,
    });
  }, [update]);

  return (
    <TextEditor
      language="json"
      label={FileNames.DATAFILE}
      text={data.dataFileContent}
      onSaveText={onSaveText}
      editedText={data.ephemera.dataFileContent}
      onSetEditedText={onSetEditedText}
      readOnly={false}
      toolbarItems={dataMessage}
      contentOnEmpty={"Enter JSON data or use the data generation tab"}
    />
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
