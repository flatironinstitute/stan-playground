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
    <div className="MainWindow" style={{ width, height }}>
      <div
        className="MainWindowContent"
        style={{
          width,
          height: H,
        }}
      >
        <HomePage width={width} height={H} />
      </div>
      {statusBarHeight && (
        <div
          className="MainWindowStatusBar"
          style={{
            width,
            height: statusBarHeight,
          }}
        >
          <StatusBar width={width} height={statusBarHeight} />
        </div>
      )}
    </div>
  );
};

export default MainWindow;
