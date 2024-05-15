import { Progress, Replies, Requests } from '../tinystan/Worker';
import StanWorker from '../tinystan/Worker?worker';

export type StanSamplerStatus = '' | 'loading' | 'loaded' | 'sampling' | 'completed' | 'failed';

class StanSampler {
    #worker: Worker | undefined;
    #status: StanSamplerStatus = '';
    #errorMessage: string = '';
    #onProgressCallbacks: ((progress: Progress) => void)[] = [];
    #onStatusChangedCallbacks: (() => void)[] = [];
    #draws: number[][] = [];
    #paramNames: string[] = [];
    constructor(private compiledUrl: string) {
        this._initialize()
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
                case Replies.SampleReturn: {
                    if (e.data.error) {
                        this.#errorMessage = e.data.error;
                        this.#status = 'failed';
                        this.#onStatusChangedCallbacks.forEach(cb => cb())
                    } else {
                        this.#draws = e.data.draws;
                        this.#paramNames = e.data.paramNames;
                        this.#status = 'completed';
                        this.#onStatusChangedCallbacks.forEach(cb => cb())
                    }
                    break;
                }
            }
        }
        this.#worker.postMessage({ purpose: Requests.Load, url: this.compiledUrl });
    }
    sample(a: {data: any, numChains: number}) {
        if (!this.#worker) return
        const { data, numChains } = a;
        this.#draws = [];
        this.#paramNames = [];
        this.#worker
            .postMessage({ purpose: Requests.Sample, sampleConfig: { data, chains: numChains } });
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
        if (!this.#worker) return;
        this.#worker.terminate();
        this.#worker = undefined;
        this._initialize();
    }
    get draws() {
        return this.#draws;
    }
    get paramNames() {
        return this.#paramNames;
    }
    get status() {
        return this.#status;
    }
    get errorMessage() {
        return this.#errorMessage;
    }
}

export default StanSampler