import { SamplerParams } from '../tinystan';
import { Progress, Replies, Requests } from '../tinystan/Worker';
import StanWorker from '../tinystan/Worker?worker';

export type StanSamplerStatus = '' | 'loading' | 'loaded' | 'sampling' | 'completed' | 'failed';

export type SamplingOpts = {
    num_chains: number
    num_warmup: number
    num_samples: number
    init_radius: number
    seed: number | undefined
}

export const defaultSamplingOpts: SamplingOpts = {
    num_chains: 4,
    num_warmup: 1000,
    num_samples: 1000,
    init_radius: 2.0,
    seed: undefined
}

class StanSampler {
    #worker: Worker | undefined;
    #status: StanSamplerStatus = '';
    #errorMessage: string = '';
    #onProgressCallbacks: ((progress: Progress) => void)[] = [];
    #onStatusChangedCallbacks: (() => void)[] = [];
    #draws: number[][] = [];
    #computeTimeSec: number | undefined = undefined;
    #paramNames: string[] = [];
    #numChains: number = 0;
    #samplingStartTimeSec: number = 0;

    private constructor(private compiledUrl: string) {
        this._initialize()
    }

    static __unsafe_create(compiledUrl: string): { sampler: StanSampler, cleanup: () => void } {
        const sampler = new StanSampler(compiledUrl);
        const cleanup = () => {
            sampler.#worker && sampler.#worker.terminate();
            sampler.#worker = undefined;
        }
        return { sampler, cleanup }
    }

    _initialize() {
        this.#worker = new StanWorker
        this.#status = 'loading'
        this.#worker.onmessage = (e) => {
            const purpose: Replies = e.data.purpose;
            switch (purpose) {
                case Replies.Progress: {
                    this.#onProgressCallbacks.forEach(callback => callback(e.data.report));
                    break;
                }
                case Replies.ModelLoaded: {
                    this.#status = 'loaded';
                    this.#onStatusChangedCallbacks.forEach(cb => cb())
                    break;
                }
                case Replies.StanReturn: {
                    if (e.data.error) {
                        this.#errorMessage = e.data.error;
                        this.#status = 'failed';
                        this.#onStatusChangedCallbacks.forEach(cb => cb())
                    } else {
                        this.#draws = e.data.draws;
                        this.#paramNames = e.data.paramNames;
                        this.#computeTimeSec = Date.now() / 1000 - this.#samplingStartTimeSec;
                        this.#status = 'completed';
                        this.#onStatusChangedCallbacks.forEach(cb => cb())
                    }
                    break;
                }
            }
        }
        this.#worker.postMessage({ purpose: Requests.Load, url: this.compiledUrl });
    }
    sample(data: any, samplingOpts: SamplingOpts) {
        const refresh = calculateReasonableRefreshRate(samplingOpts);
        const sampleConfig: Partial<SamplerParams> = {
            data,
            num_chains: samplingOpts.num_chains,
            num_warmup: samplingOpts.num_warmup,
            num_samples: samplingOpts.num_samples,
            init_radius: samplingOpts.init_radius,
            seed: samplingOpts.seed !== undefined ? samplingOpts.seed : null,
            refresh
        }
        if (!this.#worker) return
        if (this.#status === '') {
            console.warn('Model not loaded yet')
            return
        }
        if (sampleConfig.num_chains === undefined) {
            console.warn('Number of chains not specified')
            return
        }
        this.#numChains = sampleConfig.num_chains;
        if (this.#status === 'sampling') {
            console.warn('Already sampling')
            return
        }
        if (this.#status === 'loading') {
            console.warn('Model not loaded yet')
            return
        }
        this.#draws = [];
        this.#paramNames = [];
        this.#worker
            .postMessage({ purpose: Requests.Sample, sampleConfig });
        this.#samplingStartTimeSec = Date.now() / 1000;
        this.#status = 'sampling';
        this.#onStatusChangedCallbacks.forEach(cb => cb())
    }
    onProgress(callback: (progress: Progress) => void) {
        this.#onProgressCallbacks.push(callback);
    }
    onStatusChanged(callback: () => void) {
        this.#onStatusChangedCallbacks.push(callback);
    }
    cancel() {
        if (this.#status === 'sampling') {
            this.#worker && this.#worker.terminate();
            this.#status = "";
            this._initialize();
        }
        else {
            console.warn('Nothing to cancel')
        }
    }
    get draws() {
        return this.#draws;
    }
    get paramNames() {
        return this.#paramNames;
    }
    get numChains() {
        return this.#numChains;
    }
    get status() {
        return this.#status;
    }
    get errorMessage() {
        return this.#errorMessage;
    }
    get computeTimeSec() {
        return this.#computeTimeSec;
    }
}

const calculateReasonableRefreshRate = (samplingOpts: SamplingOpts) => {
    const totalSamples = (samplingOpts.num_samples + samplingOpts.num_warmup) * samplingOpts.num_chains;

    const onePercent = Math.floor(totalSamples / 100);

    const nearestMultipleOfTen = Math.round(onePercent / 10) * 10;

    return Math.max(10, nearestMultipleOfTen);
}

export default StanSampler
