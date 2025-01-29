import { Split } from "@geoffcox/react-splitter";
import Box from "@mui/material/Box";
import styled from "@mui/material/styles/styled";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ProjectContext } from "@SpCore/Project/ProjectContextProvider";
import Sidebar, { drawerWidth } from "@SpPages/Sidebar";
import TopBar from "@SpPages/TopBar";
import { FunctionComponent, use, useEffect, useRef, useState } from "react";
import ControlArea from "@SpAreas/ControlArea";
import ModelDataArea from "@SpAreas/ModelDataArea";

const HomePage: FunctionComponent = () => {
  const { data } = use(ProjectContext);

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

      <Sidebar collapsed={leftPanelCollapsed} />

      <MovingBox open={leftPanelCollapsed} flex="1" minHeight="0">
        <Split minPrimarySize="80px" minSecondarySize="120px">
          <ModelDataArea />
          <ControlArea />
        </Split>
      </MovingBox>
    </Box>
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
