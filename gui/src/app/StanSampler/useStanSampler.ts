import { useEffect, useState } from "react";
import StanSampler, { StanSamplerStatus } from "./StanSampler";
import { Progress } from "../tinystan/Worker";

const useStanSampler = (compiledMainJsUrl: string | undefined) => {
    const [sampler, setSampler] = useState<StanSampler | undefined>(undefined);
    useEffect(() => {
        if (!compiledMainJsUrl) {
            setSampler(undefined);
            return;
        }
        const { sampler, cleanup: destructor } = StanSampler.__unsafe_create(compiledMainJsUrl);
        setSampler(sampler);
        return destructor;

    }, [compiledMainJsUrl])

    return { sampler }
}

export const useSamplerStatus = (sampler: StanSampler | undefined) => {
    const [status, setStatus] = useState<StanSamplerStatus>('');
    const [errorMessage, setErrorMessage] = useState<string>('');
    useEffect(() => {
        if (!sampler) return;
        let canceled = false;
        setStatus(sampler.status);
        const cb = () => {
            if (canceled) return;
            setStatus(sampler.status);
            if (sampler.status === 'failed') {
                setErrorMessage(sampler.errorMessage);
            }
        }
        sampler.onStatusChanged(cb);
        return () => {
            canceled = true;
        }
    }, [sampler]);
    return { status, errorMessage };
}

export const useSamplerProgress = (sampler: StanSampler | undefined) => {
    const [progress, setProgress] = useState<Progress | undefined>(undefined);
    useEffect(() => {
        setProgress(undefined);
        if (!sampler) return;
        let canceled = false;
        const cb = (progress: Progress) => {
            if (canceled) return;
            setProgress(progress);
        }
        sampler.onProgress(cb);
        return () => {
            canceled = true;
        }
    }, [sampler]);
    return progress;
}

export const useSamplerOutput = (sampler: StanSampler | undefined) => {
    const [draws, setDraws] = useState<number[][] | undefined>();
    const [paramNames, setParamNames] = useState<string[] | undefined>();
    const [numChains, setNumChains] = useState<number | undefined>();
    const [computeTimeSec, setComputeTimeSec] = useState<number | undefined>();

    useEffect(() => {
        let canceled = false;
        if (!sampler) {
            setDraws(undefined);
            setParamNames(undefined);
            setNumChains(undefined);
            setComputeTimeSec(undefined);
            return;
        }
        sampler.onStatusChanged(() => {
            if (canceled) return;
            if (sampler.status === 'completed') {
                setDraws(sampler.draws);
                setParamNames(sampler.paramNames);
                setNumChains(sampler.numChains);
                setComputeTimeSec(sampler.computeTimeSec);
            }
            else {
                setDraws(undefined)
                setParamNames(undefined)
                setNumChains(undefined)
                setComputeTimeSec(undefined)
            }
        })
        return (
            () => {
                canceled = true;
            }
        )
    }, [sampler]);

    return { draws, paramNames, numChains, computeTimeSec }
}

export default useStanSampler;
