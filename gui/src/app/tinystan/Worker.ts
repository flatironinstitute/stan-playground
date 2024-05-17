import StanModel from ".";

export enum Requests {
    Load = "load",
    Sample = "sample",
    Pathfinder = "pathfinder",
}

export enum Replies {
    ModelLoaded = "modelLoaded",
    StanReturn = "stanReturn",
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

    // But if there is only one chain, then
    // the "Chain [x]" part is omitted.
    if (msg.startsWith('Iteration:')) {
        msg = 'Chain [1] ' + msg;
    }
    const parts = msg.split(/\s+/);
    const chain = parseInt(parts[1].slice(1, -1));
    const iteration = parseInt(parts[3]);
    const totalIterations = parseInt(parts[5]);
    const percent = parseInt(parts[7].slice(0, -2));
    const warmup = parts[8] === '(Warmup)';
    return { chain, iteration, totalIterations, percent, warmup };
}

const progressPrintCallback = (msg: string) => {
    if ((!msg.startsWith('Chain')) && (!msg.startsWith('Iteration:'))) {
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
                postMessage({ purpose: Replies.StanReturn, error: "Model not loaded yet!" })
                return;
            }
            try {
                const { paramNames, draws } = model.sample(e.data.sampleConfig);
                // TODO? use an ArrayBuffer so we can transfer without serialization cost
                postMessage({ purpose: Replies.StanReturn, draws, paramNames, error: null });
            } catch (e: any) {
                postMessage({ purpose: Replies.StanReturn, error: e.toString() })
            }
            break;
        }
        case Requests.Pathfinder: {
            if (!model) {
                postMessage({ purpose: Replies.StanReturn, error: "Model not loaded yet!" })
                return;
            }
            try {
                const { draws, paramNames } = model.pathfinder(e.data.pathfinderConfig);
                // TODO? use an ArrayBuffer so we can transfer without serialization cost
                postMessage({ purpose: Replies.StanReturn, draws, paramNames, error: null });
            } catch (e: any) {
                postMessage({ purpose: Replies.StanReturn, error: e.toString() })
            }
            break;
        }
    }
}
