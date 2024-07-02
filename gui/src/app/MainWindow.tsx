import { useWindowDimensions } from "@fi-sci/misc";
import { FunctionComponent } from "react";
import StatusBar, { statusBarHeight } from "./StatusBar";
import HomePage from "./pages/HomePage/HomePage";
import PrototypesWindow from "./prototypes/PrototypesWindow";

// We want to be as unobtrusive as possible, so we're not going to hook into the
// routing system for the application. We just have this test for
// prototypes, which is a query parameter that can be set to 1 to enable the
// prototypes. Then below we just render the Prototypes Window on this
// condition.
const query = new URLSearchParams(window.location.search);
const prototypesMode = query.get("prototypes") === "1";

type Props = {
  // none
};

const MainWindow: FunctionComponent<Props> = () => {
  const { width, height } = useWindowDimensions();
  const H = height - statusBarHeight;

  if (prototypesMode) {
    // See comment above
    return <PrototypesWindow width={width} height={height} />;
  }

  return (
    <div
      className="MainWindow"
      style={{ position: "absolute", width, height, overflow: "hidden" }}
    >
      <div
        className="MainWindowContent"
        style={{
          position: "absolute",
          top: 0,
          width,
          height: H,
          overflow: "hidden",
        }}
      >
        <HomePage width={width} height={H} />
      </div>
      {statusBarHeight && (
        <div
          className="MainWindowStatusBar"
          style={{
            position: "absolute",
            bottom: 0,
            width,
            height: statusBarHeight,
            backgroundColor: "#eee",
            overflow: "hidden",
          }}
        >
          <StatusBar width={width} height={statusBarHeight} />
        </div>
      )}
    </div>
  );
};

export default MainWindow;
