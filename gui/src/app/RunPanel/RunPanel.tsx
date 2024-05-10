/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import StanModel from '../tinystan/StanModel';
import { setSamplerPrintHandler } from '../pages/HomePage/HomePage';

type RunPanelProps = {
    width: number;
    height: number;
    stanModel: StanModel | undefined;
    data: any | undefined
    dataIsSaved: boolean
};

type RunStatus = '' | 'running' | 'done' | 'failed';

type Progress = {
    chain: number;
    iteration: number;
    totalIterations: number;
    percent: number;
    warmup: boolean;
}

const RunPanel: FunctionComponent<RunPanelProps> = ({ width, height, stanModel, data, dataIsSaved }) => {
    const [runStatus, setRunStatus] = useState<RunStatus>('');
    const [errorMessage, setErrorMessage] = useState<string>(''); // [1
    const [samples, setSamples] = useState<number[][] | undefined>(undefined);
    const [stanModelOfLastRun, setStanModelOfLastRun] = useState<StanModel | undefined>(undefined);
    const [dataOfLastRun, setDataOfLastRun] = useState<string | undefined>(undefined);
    const progress = useRef<Progress | undefined>(undefined);
    const handleRun = useCallback(async () => {
        if (!stanModel) return;
        if (!data) return;
        if (runStatus === 'running') return;
        setSamplerPrintHandler((msg: string) => {
            // example message: Chain [4] Iteration: 1800 / 2000 [ 90%] (Sampling)
            console.log(msg)
            // Example: Chain [1] Iteration: 2000 / 2000 [100%]  (Sampling)
            if (!msg.startsWith('Chain')) return;
            const parts = msg.split(' ');
            const chain = parseInt(parts[1].slice(1, -1));
            const iteration = parseInt(parts[3]);
            const totalIterations = parseInt(parts[5]);
            const percent = parseInt(parts[7].slice(0, -2));
            const warmup = parts[8] === '(Warmup)';
            progress.current = { chain, iteration, totalIterations, percent, warmup };
        });
        setRunStatus('running');
        setErrorMessage('');
        setSamples(undefined);
        setStanModelOfLastRun(stanModel);
        setDataOfLastRun(JSON.stringify(data));
        await new Promise(resolve => setTimeout(resolve, 500)); // for effect
        let samples: any
        try {
            console.log('sampling')
            samples = stanModel.sample({data})
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
                            <div>
                                <h4>Sampling</h4>
                                <SamplingProgressComponent
                                    progressRef={progress}
                                />
                            </div>
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

type SamplingProgressComponentProps = {
    progressRef: React.MutableRefObject<Progress | undefined>
}

const SamplingProgressComponent: FunctionComponent<SamplingProgressComponentProps> = ({ progressRef }) => {
    const [progress, setProgress] = useState<Progress | undefined>(undefined);
    useEffect(() => {
        // poll
        const interval = setInterval(() => {
            setProgress(progressRef.current);
        }, 100);
        return () => clearInterval(interval);
    }, [progressRef]);
    if (!progress) return <span />
    return (
        <div>
            Chain {progress.chain} Iteration: {progress.iteration} / {progress.totalIterations} [ {progress.percent}%] ({progress.warmup ? 'Warmup' : 'Sampling'})
        </div>
    )
}

export default RunPanel;