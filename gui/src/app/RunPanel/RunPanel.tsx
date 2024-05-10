/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, useCallback, useMemo, useState } from 'react';
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
    const [errorMessage, setErrorMessage] = useState<string>(''); // [1
    const [samples, setSamples] = useState<number[][] | undefined>(undefined);
    const [stanModelOfLastRun, setStanModelOfLastRun] = useState<StanModel | undefined>(undefined);
    const [dataOfLastRun, setDataOfLastRun] = useState<string | undefined>(undefined);
    const handleRun = useCallback(async () => {
        if (!stanModel) return;
        if (!data) return;
        if (runStatus === 'running') return;
        setRunStatus('running');
        setErrorMessage('');
        setSamples(undefined);
        setStanModelOfLastRun(stanModel);
        setDataOfLastRun(JSON.stringify(data));
        await new Promise(resolve => setTimeout(resolve, 500)); // for effect
        let samples: any
        try {
            console.log('sampling')
            samples = stanModel.sample(data)
        }
        catch (err: any) {
            console.error(err)
            setRunStatus('failed')
            setErrorMessage(err.message)
            return
        }
        setRunStatus('done')
        setSamples(samples)
    }, [stanModel, data, runStatus]);
    const modelAndDataAreConsistentWithLastRun = useMemo(() => {
        return stanModel === stanModelOfLastRun && JSON.stringify(data) === dataOfLastRun
    }, [stanModel, data, stanModelOfLastRun, dataOfLastRun]);
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
                        runStatus === 'done' && modelAndDataAreConsistentWithLastRun && (
                            <span>&nbsp;&nbsp;done sampling</span>
                        )
                    }
                    {
                        runStatus === 'failed' && modelAndDataAreConsistentWithLastRun && (
                            <span>&nbsp;&nbsp;failed: {errorMessage} (see browser console for more details)</span>
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