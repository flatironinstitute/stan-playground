/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, useCallback, useEffect, useState } from 'react';
import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import StanWorker from '../tinystan/Worker?worker';
import { Progress, Replies, Requests } from '../tinystan/Worker'

type RunPanelProps = {
    width: number;
    height: number;
    compiledUrl: string;
    data: any | undefined
    dataIsSaved: boolean
};

type RunStatus = '' | 'waiting' | 'running' | 'done' | 'failed';

const chains = 4;

const RunPanel: FunctionComponent<RunPanelProps> = ({ width, height, compiledUrl, data, dataIsSaved }) => {

    const [runStatus, setRunStatus] = useState<RunStatus>('waiting');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [samples, setSamples] = useState<number[][] | undefined>(undefined);
    const [paramNames, setParamNames] = useState<string[] | undefined>(undefined);

    const [progress, setProgress] = useState<Progress | undefined>(undefined);

    const [modelWorker, setModelWorker] = useState<Worker | undefined>(undefined);

    // Cancellation destroys the worker, and therefore
    // requires the same code to be run as if a new
    // URL was provided. This state is therefore
    // used to force the following useEffect hook to rerun.
    const [trigger, setTrigger] = useState(false);

    useEffect(() => {
        if (!compiledUrl) {
            setModelWorker(undefined);
            return;
        }
        const worker = new StanWorker();
        setModelWorker(worker);
        worker.postMessage({ purpose: Requests.Load, url: compiledUrl });
        return () => {
            if (worker) {
                console.log("Cleaning up worker");
                worker.terminate();
            }
        }
    }, [compiledUrl, trigger])

    const handleRun = useCallback(async () => {
        if (!modelWorker) return;
        setRunStatus('running');
        setErrorMessage('');
        setSamples(undefined);
        setProgress(undefined);
        console.log('sampling')
        modelWorker
            .postMessage({ purpose: Requests.Sample, sampleConfig: { data, chains } });
    }, [modelWorker, data]);

    const cancelRun = useCallback(() => {
        setRunStatus('waiting');
        setTrigger(t => !t);
    }, [setTrigger]);

    useEffect(() => {
        if (!modelWorker) {
            setRunStatus('waiting');
            return;
        }
        modelWorker.onmessage = (e) => {
            const purpose: Replies = e.data.purpose;
            switch (purpose) {
                case Replies.Progress: {
                    setProgress(e.data.report);
                    break;
                }
                case Replies.ModelLoaded: {
                    setRunStatus('');
                    break;
                }
                case Replies.SampleReturn: {
                    if (e.data.error) {
                        setErrorMessage(e.data.error);
                        setRunStatus('failed');
                    } else {
                        setSamples(e.data.draws);
                        setParamNames(e.data.paramNames);
                        setRunStatus('done');
                    }
                    break;
                }
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
                                <SamplingProgressComponent report={progress} />
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
                {runStatus === 'done' && samples && paramNames && (
                    <DrawsDisplay draws={samples} paramNames={paramNames} />
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
        <>
            <div style={{ width: "60%" }}>
                <LinearProgressWithLabel sx={{ height: 10 }} value={progress} />
            </div>
            <div>
                Chain {report.chain} Iteration: {report.iteration} / {report.totalIterations} ({report.warmup ? 'Warmup' : 'Sampling'})
            </div>
        </>
    )
}


// from https://mui.com/material-ui/react-progress/#linear-with-label
const LinearProgressWithLabel = (props: LinearProgressProps & { value: number }) => {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress variant="determinate" {...props} />
            </Box>
            <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">{`${Math.round(
                    props.value,
                )}%`}</Typography>
            </Box>
        </Box>
    );
}


type DrawsDisplayProps = {
    draws: number[][],
    paramNames: string[]
}

const DrawsDisplay: FunctionComponent<DrawsDisplayProps> = ({ draws, paramNames }) => {
    const means: { [k: string]: number } = {};

    for (const [i, element] of paramNames.entries()) {
        let sum = 0;
        for (const draw of draws[i]) {
            sum += draw;
        }
        means[element] = sum / draws[i].length;
    }

    return (
        <div>
            <h3>Samples</h3>

            <pre>Means: {JSON.stringify(means, null, 2)}</pre>
            <pre>Draws: {JSON.stringify(draws, null, 2)}</pre>
        </div>
    )
}

export default RunPanel;
