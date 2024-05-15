/* eslint-disable @typescript-eslint/no-explicit-any */
import Box from '@mui/material/Box';
import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { FunctionComponent, useCallback, useEffect, useState } from 'react';

import StanSampler, { StanSamplerStatus } from '../StanSampler/StanSampler';
import { Progress } from '../tinystan/Worker';
import { defaultSamplerParams } from '../tinystan';

type RunPanelProps = {
    width: number;
    height: number;
    sampler?: StanSampler;
    data: any | undefined
    dataIsSaved: boolean
};

const numChains = 4;

const RunPanel: FunctionComponent<RunPanelProps> = ({ width, height, sampler, data, dataIsSaved }) => {

    const [runStatus, setRunStatus] = useState<StanSamplerStatus>('');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const [progress, setProgress] = useState<Progress | undefined>(undefined);

    useEffect(() => {
        if (!sampler) return;
        let canceled = false;
        sampler.onStatusChanged(() => {
            if (canceled) return;
            setRunStatus(sampler.status);
            if (sampler.status === 'failed') {
                setErrorMessage(sampler.errorMessage);
            }
        })
        sampler.onProgress((progress: Progress) => {
            if (canceled) return;
            setProgress(progress);
        })
        return (
            () => {
                canceled = true;
                sampler.cancel();
            }
        )
    }, [sampler]);

    const handleRun = useCallback(async () => {
        if (!sampler) return;
        setErrorMessage('');
        setProgress(undefined);
        console.log('sampling')
        sampler.sample({...defaultSamplerParams, data, num_chains: numChains})
    }, [sampler, data]);

    const cancelRun = useCallback(() => {
        if (!sampler) return;
        sampler.cancel()
    }, [sampler]);

    if (!sampler) return (
        <div style={{ padding: 5 }}>
            Stan model not compiled
        </div>
    )

    if (!dataIsSaved) {
        return (
            <div style={{ padding: 5 }}>
                Data not saved
            </div>
        )
    }
    return (
        <div style={{ position: 'absolute', width, height, overflowY: 'auto' }}>
            <div style={{ padding: 5 }}>
                <div>
                    <button onClick={handleRun} disabled={runStatus === 'sampling' || runStatus === 'loading'}>Run</button>
                    <button onClick={cancelRun} disabled={runStatus !== 'sampling'}>Cancel</button>
                    {
                        runStatus === 'loading' && (
                            <div>
                                Loading compiled Stan model...
                            </div>
                        )
                    }
                    {
                        runStatus === 'sampling' && (
                            <div>
                                Sampling
                                <SamplingProgressComponent report={progress} />
                            </div>
                        )
                    }
                    {
                        runStatus === 'completed' && (
                            <div>
                                done sampling
                            </div>
                        )
                    }
                    {
                        runStatus === 'failed' && (
                            <div>
                                failed: {errorMessage} (see browser console for more details)
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    )
}

type SamplingProgressComponentProps = {
    report: Progress | undefined
}

const SamplingProgressComponent: FunctionComponent<SamplingProgressComponentProps> = ({ report }) => {
    if (!report) return <span />
    const progress = (report.iteration + ((report.chain - 1) * report.totalIterations)) / (report.totalIterations * numChains) * 100;
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

export default RunPanel;
