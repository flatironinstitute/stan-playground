import { useWindowDimensions } from "@fi-sci/misc";
import HomePage from "@SpPages/HomePage";
import { FunctionComponent } from "react";
import StatusBar, { statusBarHeight } from "./StatusBar";

type Props = {
  // none
};

const MainWindow: FunctionComponent<Props> = () => {
  const { width, height } = useWindowDimensions();
  const H = height - statusBarHeight;
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
