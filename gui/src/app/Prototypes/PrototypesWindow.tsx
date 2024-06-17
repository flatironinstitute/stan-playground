import { FunctionComponent, useCallback, useState } from "react"
import AnalysisPyPrototype from "./AnalysisPyPrototype/AnalysisPyPrototype"
import DataPyPrototype from "./DataPyPrototype/DataPyPrototype"
import DataRPrototype from "./DataRPrototype/DataRPrototype"
import useRoute from "../useRoute"

type TestDataPyWindowProps = {
    width: number
    height: number
}

const PrototypesWindow: FunctionComponent<TestDataPyWindowProps> = ({width, height}) => {
    const leftPanelWidth = 300

    const { route, setRoute } = useRoute()
    if (route.page !== 'prototypes') {
        throw new Error('Unexpected route')
    }

    const selection = route.selection
    const setSelection = useCallback((selection: 'data.py' | 'data.r' | 'analysis.py') => {
        setRoute({page: 'prototypes', selection})
    }, [setRoute])

    return (
        <div style={{position: 'absolute', width, height, overflow: 'hidden', background: 'white'}}>
            <div style={{position: 'absolute', top: 0, left: 0, width: leftPanelWidth, height, overflowY: 'auto'}}>
                <div style={{padding: 20}}>
                    <p>
                        Please make a selection
                    </p>
                    <div>
                        <input type="radio" id="data.py" name="example" value="data.py" checked={selection === 'data.py'} onChange={() => setSelection('data.py')} />
                        <label htmlFor="data.py">data.py</label>
                    </div>
                    <div>
                        <input type="radio" id="data.r" name="example" value="data.r" checked={selection === 'data.r'} onChange={() => setSelection('data.r')} />
                        <label htmlFor="data.r">data.r</label>
                    </div>
                    <div>
                        <input type="radio" id="analysis.py" name="example" value="analysis.py" checked={selection === 'analysis.py'} onChange={() => setSelection('analysis.py')} />
                        <label htmlFor="analysis.py">analysis.py</label>
                    </div>
                    {
                        selection === 'data.py' ? (
                            <div>
                                <p>
                                    This is an example of how data generation via Python script might work. It uses Pyodide in the browser.
                                </p>
                                <p>
                                    The value of the global variable <code>data</code> is used to pass data from the Python script to the output window.
                                </p>
                            </div>
                        ) : selection === 'data.r' ? (
                            <div>
                                <p>
                                    This is an example of how data generation via R script might work. It uses webr in the browser.
                                </p>
                                <p>
                                    The value of the global variable <code>data</code> is used to pass data from the R script to the output window.
                                </p>
                            </div>
                        ) : selection === 'analysis.py' ? (
                            <div>
                                <p>
                                    This is an example of how downstream analysis via Python script might work. It uses Pyodide in the browser.
                                </p>
                            </div>
                        ) : <div />
                    }
                </div>
            </div>
            <div style={{position: 'absolute', top: 0, left: leftPanelWidth, width: width - leftPanelWidth, height, overflowY: 'hidden'}}>
                {
                    selection === 'data.py' ? (
                        <DataPyPrototype
                            width={width - leftPanelWidth}
                            height={height}
                        />
                    ) : selection === 'data.r' ? (
                        <DataRPrototype
                            width={width - leftPanelWidth}
                            height={height}
                        />
                    ) : selection === 'analysis.py' ? (
                        <AnalysisPyPrototype
                            width={width - leftPanelWidth}
                            height={height}
                        />
                    ) : <div />
                }
            </div>
        </div>
    )
}

export default PrototypesWindow