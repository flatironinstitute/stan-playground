/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, useCallback, useEffect, useState } from 'react';
import LinearProgress from '@mui/material/LinearProgress';
import StanWorker from '../tinystan/Worker?worker';

type RunPanelProps = {
    width: number;
    height: number;
    compiledUrl: string;
    data: any | undefined
    dataIsSaved: boolean
};

type RunStatus = '' | 'waiting' | 'running' | 'done' | 'failed';

type Progress = {
    chain: number;
    iteration: number;
    totalIterations: number;
    percent: number;
    warmup: boolean;
}

const chains = 4;

const RunPanel: FunctionComponent<RunPanelProps> = ({ width, height, compiledUrl, data, dataIsSaved }) => {

    const [runStatus, setRunStatus] = useState<RunStatus>('waiting');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [samples, setSamples] = useState<number[][] | undefined>(undefined);
    const [progress, setProgress] = useState<Progress | undefined>(undefined);

    const [modelWorker, setModelWorker] = useState<Worker | undefined>(undefined);

    // TODO: is this the best way to trigger re-loading the worker without a cycle?
    const [t, trigger] = useState(0);

    useEffect(() => {
        if (!compiledUrl) {
            setModelWorker(undefined);
            return;
        }
        const worker = new StanWorker();
        setModelWorker(worker);
        worker.postMessage({ purpose: "load", url: compiledUrl });
        return () => {
            if (worker) {
                console.log("Cleaning up worker");
                worker.terminate();
            }
        }
    }, [compiledUrl, t])

    const handleRun = useCallback(async () => {
        if (!modelWorker) return;
        setRunStatus('running');
        setErrorMessage('');
        setSamples(undefined);
        setProgress(undefined);
        console.log('sampling')
        modelWorker
            .postMessage({ purpose: "sample", sampleConfig: { data, chains } });
    }, [modelWorker, data]);

    const cancelRun = useCallback(() => {
        setRunStatus('waiting');
        // after calling terminate, the worker is no longer usable
        // so we create a new one
        trigger(t => t + 1);
    }, [trigger]);

    useEffect(() => {
        if (!modelWorker) {
            setRunStatus('waiting');
            return;
        }
        modelWorker.onmessage = (e) => {
            const purpose = e.data.purpose;
            if (purpose === "progress") {
                setProgress(e.data.report);
                return;
            }
            if (purpose === "modelLoaded") {
                setRunStatus('')
                return;
            }
            if (purpose === "sampleReturn") {
                if (e.data.error) {
                    setRunStatus('failed')
                    setErrorMessage(e.data.error)
                    return;
                }
                setRunStatus('done')
                setSamples(e.data.draws)
            }
        }
    }, [modelWorker]);

    if (!modelWorker) return (
        <div style={{ padding: 30 }}>
            Stan model not compiled
        </div>
    )

    if (!dataIsSaved) {
        return (
            <div style={{ padding: 30 }}>
                Data not saved
            </div>
        )
    }
    return (
        <div style={{ position: 'absolute', width, height, overflowY: 'auto' }}>
            <div style={{ padding: 20 }}>
                <div>
                    <button onClick={handleRun} disabled={runStatus === 'running' || runStatus === 'waiting'}>Run</button>
                    <button onClick={cancelRun} disabled={runStatus !== 'running'}>Cancel</button>
                    {
                        runStatus === 'waiting' && (
                            <div>
                                <h4>Loading compiled Stan model...</h4>
                            </div>
                        )
                    }
                    {
                        runStatus === 'running' && (
                            <div>
                                <h4>Sampling</h4>
                                <SamplingProgressComponent
                                    report={progress}
                                />
                            </div>
                        )
                    }
                    {
                        runStatus === 'done' && (
                            <span>&nbsp;&nbsp;done sampling</span>
                        )
                    }
                    {
                        runStatus === 'failed' && (
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
    report: Progress | undefined
}

const SamplingProgressComponent: FunctionComponent<SamplingProgressComponentProps> = ({ report }) => {
    if (!report) return <span />
    const progress = (report.iteration + ((report.chain - 1) * report.totalIterations)) / (report.totalIterations * chains) * 100;
    return (
        <div style={{ width: "80%" }}>
            <LinearProgress  sx={{height:10}} variant="determinate" value={progress} /> {Math.round(progress)}%
            <div>
                Chain {report.chain} Iteration: {report.iteration} / {report.totalIterations} ({report.warmup ? 'Warmup' : 'Sampling'})
            </div>
        </div>
    )
}

export default RunPanel;
