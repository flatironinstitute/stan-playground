import StanModel from ".";

export enum Requests {
    Load = "load",
    Sample = "sample",
}

export enum Replies {
    ModelLoaded = "modelLoaded",
    SampleReturn = "sampleReturn",
    Progress = "progress",
}

export type Progress = {
    chain: number;
    iteration: number;
    totalIterations: number;
    percent: number;
    warmup: boolean;
}

const parseProgress = (msg: string): Progress => {
    // Examples (note different spacing):
    // Chain [1] Iteration: 2000 / 2000 [100%]  (Sampling)
    // Chain [2] Iteration:  800 / 2000 [ 40%]  (Warmup)
    const parts = msg.split(/\s+/);
    const chain = parseInt(parts[1].slice(1, -1));
    const iteration = parseInt(parts[3]);
    const totalIterations = parseInt(parts[5]);
    const percent = parseInt(parts[7].slice(0, -2));
    const warmup = parts[8] === '(Warmup)';
    return { chain, iteration, totalIterations, percent, warmup };
}

const progressPrintCallback = (msg: string) => {
    if (!msg.startsWith('Chain')) {
        console.log(msg);
        return;
    }
    const report = parseProgress(msg);
    postMessage({ purpose: Replies.Progress, report })
}


let model: StanModel;

onmessage = function (e) {
    const purpose: Requests = e.data.purpose;

    switch (purpose) {
        case Requests.Load: {
            import(/* @vite-ignore */ e.data.url)
                .then(
                    js => StanModel.load(js.default, progressPrintCallback))
                .then(
                    m => {
                        model = m;
                        console.log("Web Worker loaded Stan model built from version " + m.stanVersion());
                        postMessage({ purpose: Replies.ModelLoaded });
                    });
            break;
        }
        case Requests.Sample: {
            if (!model) {
                postMessage({ purpose: Replies.SampleReturn, error: "Model not loaded yet!" })
                return;
            }
            try {
                const { paramNames, draws } = model.sample(e.data.sampleConfig);
                // TODO? use an ArrayBuffer so we can transfer without serialization cost
                postMessage({ purpose: Replies.SampleReturn, draws, paramNames, error: null });
            } catch (e: any) {
                postMessage({ purpose: Replies.SampleReturn, error: e.toString() })
            }
            break;
        }
    }
}