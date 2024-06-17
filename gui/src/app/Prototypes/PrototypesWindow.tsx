import { FunctionComponent, useState } from "react"
import DataPyPrototype from "./DataPyPrototype/DataPyPrototype"
import DataRFileEditor from "./DataRPrototype/DataRFileEditor"
import DataRPrototype from "./DataRPrototype/DataRPrototype"

type TestDataPyWindowProps = {
    width: number
    height: number
}

type ExampleChoice = 'data.py' | 'data.r' | 'analysis.py'

const PrototypesWindow: FunctionComponent<TestDataPyWindowProps> = ({width, height}) => {
    const leftPanelWidth = 300

    const [exampleChoice, setExampleChoice] = useState<ExampleChoice>('data.py')

    return (
        <div style={{position: 'absolute', width, height, overflow: 'hidden', background: 'white'}}>
            <div style={{position: 'absolute', top: 0, left: 0, width: leftPanelWidth, height, overflowY: 'auto'}}>
                <div style={{padding: 20}}>
                    <p>
                        Please make a selection
                    </p>
                    <div>
                        <input type="radio" id="data.py" name="example" value="data.py" checked={exampleChoice === 'data.py'} onChange={() => setExampleChoice('data.py')} />
                        <label htmlFor="data.py">data.py</label>
                    </div>
                    <div>
                        <input type="radio" id="data.r" name="example" value="data.r" checked={exampleChoice === 'data.r'} onChange={() => setExampleChoice('data.r')} />
                        <label htmlFor="data.r">data.r</label>
                    </div>
                    <div>
                        <input type="radio" id="analysis.py" name="example" value="analysis.py" checked={exampleChoice === 'analysis.py'} onChange={() => setExampleChoice('analysis.py')} />
                        <label htmlFor="analysis.py">analysis.py</label>
                    </div>
                    {
                        exampleChoice === 'data.py' ? (
                            <div>
                                <p>
                                    This is an example of how data generation via Python script might work. It uses Pyodide in the browser.
                                </p>
                                <p>
                                    The value of the global variable <code>data</code> is used to pass data from the Python script to the output window.
                                </p>
                            </div>
                        ) : exampleChoice === 'data.r' ? (
                            <div>
                                <p>
                                    This is an example of how data generation via R script might work. It uses webr in the browser.
                                </p>
                                <p>
                                    The value of the global variable <code>data</code> is used to pass data from the R script to the output window.
                                </p>
                            </div>
                        ) : exampleChoice === 'analysis.py' ? (
                            <div>
                                <p>
                                    Not yet implemented.
                                </p>
                            </div>
                        ) : <div />
                    }
                </div>
            </div>
            <div style={{position: 'absolute', top: 0, left: leftPanelWidth, width: width - leftPanelWidth, height, overflowY: 'hidden'}}>
                {
                    exampleChoice === 'data.py' ? (
                        <DataPyPrototype
                            width={width - leftPanelWidth}
                            height={height}
                        />
                    ) : exampleChoice === 'data.r' ? (
                        <DataRPrototype
                            width={width - leftPanelWidth}
                            height={height}
                        />
                    ) : exampleChoice === 'analysis.py' ? (
                        <div>
                            Not yet implemented
                        </div>
                    ) : <div />
                }
            </div>
        </div>
    )
}

export default PrototypesWindow