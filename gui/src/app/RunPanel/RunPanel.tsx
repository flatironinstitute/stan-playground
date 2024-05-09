/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, useCallback, useState } from 'react';
import StanModel from '../tinystan/StanModel';

type RunPanelProps = {
    width: number;
    height: number;
    stanModel: StanModel | undefined;
    data: any | undefined
    dataIsSaved: boolean
};

type RunStatus = '' | 'running' | 'done' | 'failed';

const RunPanel: FunctionComponent<RunPanelProps> = ({ width, height, stanModel, data, dataIsSaved }) => {
    const [runStatus, setRunStatus] = useState<RunStatus>('');
    const [samples, setSamples] = useState<number[][] | undefined>(undefined);
    const handleRun = useCallback(async () => {
        if (!stanModel) return;
        if (!data) return;
        setRunStatus('running');
        await new Promise(resolve => setTimeout(resolve, 500)); // for effect
        const samples = stanModel.sample(data)
        setRunStatus('done')
        setSamples(samples)
    }, [stanModel, data]);
    if (!stanModel) return (
        <div style={{padding: 30}}>
            Stan model not compiled
        </div>
    )
    if (!data) {
        return (
            <div style={{padding: 30}}>
                No data
            </div>
        )
    }
    if (!dataIsSaved) {
        return (
            <div style={{padding: 30}}>
                Data not saved
            </div>
        )
    }
    return (
        <div style={{position: 'absolute', width, height, overflowY: 'auto'}}>
            <div style={{padding: 20}}>
                <div>
                    <button onClick={handleRun} disabled={runStatus === 'running'}>Run</button>
                    {
                        runStatus === 'running' && (
                            <span>&nbsp;&nbsp;sampling...</span>
                        )
                    }
                    {
                        runStatus === 'done' && (
                            <span>&nbsp;&nbsp;done sampling</span>
                        )
                    }
                    {
                        runStatus === 'failed' && (
                            <span>&nbsp;&nbsp;failed</span>
                        )
                    }
                </div>
                {runStatus === 'done' && samples && (
                    <div>
                        <h3>Samples</h3>
                        <pre>{JSON.stringify(samples, null, 2)}</pre>
                    </div>
                )}
            </div>
        </div>
    )
}

export default RunPanel;