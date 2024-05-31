import { useWindowDimensions } from "@fi-sci/misc";
import { FunctionComponent } from "react";
import StatusBar, { statusBarHeight } from "./StatusBar";
import HomePage from "./pages/HomePage/HomePage";
import useRoute from "./useRoute";

type Props = {
    // none
}

const MainWindow: FunctionComponent<Props> = () => {
    const {route} = useRoute()
    const {width, height} = useWindowDimensions()
    return (
        <div className="MainWindow" style={{position: 'absolute', width, height, overflow: 'hidden'}}>
            {/* <div className="MainWindowApplicationBar" style={{position: 'absolute', width, height: applicationBarHeight, overflow: 'hidden'}}>
                <ApplicationBar />
            </div> */}
            <div className="MainWindowContent" style={{position: 'absolute', width, height, overflow: 'hidden'}}>
                {
                    route.page === 'home' ? (
                        <HomePage width={width} height={height} />
                    ) : route.page === 'about' ? (
                        <HomePage width={width} height={height} />
                    ) : (
                        <div>404</div>
                    )
                }
            </div>
            {
                statusBarHeight && (
                    <div className="MainWindowStatusBar" style={{position: 'absolute', bottom: 0, width, height: statusBarHeight, backgroundColor: '#eee', overflow: 'hidden'}}>
                        <StatusBar
                            width={width}
                            height={statusBarHeight}
                        />
                    </div>
                )
            }
        </div>
    )
}

export default MainWindow