import StanModel from ".";


const progressPrintCallback = (msg: string) => {
    // Examples:
    // Chain [1] Iteration: 2000 / 2000 [100%]  (Sampling)
    // Chain [2] Iteration:  800 / 2000 [ 40%]  (Warmup)
    if (!msg.startsWith('Chain')) {
        console.log(msg);
        return;
    }
    const parts = msg.split(/\s+/);
    const chain = parseInt(parts[1].slice(1, -1));
    const iteration = parseInt(parts[3]);
    const totalIterations = parseInt(parts[5]);
    const percent = parseInt(parts[7].slice(0, -2));
    const warmup = parts[8] === '(Warmup)';
    postMessage({ purpose: "progress", report: { chain, iteration, totalIterations, percent, warmup } })
}

let model: StanModel;

onmessage = function (e) {
    const purpose = e.data.purpose;

    if (purpose === "load") {
        import(/* @vite-ignore */ e.data.url)
            .then(
                js => StanModel.load(js.default, progressPrintCallback))
            .then(
                m => {
                    model = m;
                    console.log("Web Worker loaded Stan model built from version " + m.stanVersion());
                    postMessage({ purpose: "modelLoaded" });
                });


    } else if (purpose === "sample") {
        if (!model) {
            postMessage({ purpose: "sampleReturn", error: "Model not loaded yet!" })
            return;
        }
        try {
            const ret = model.sample(e.data.sampleConfig);
            // TODO use an ArrayBuffer so we can transfer without serialization cost
            postMessage({ purpose: "sampleReturn", draws: ret, error: null });
        } catch (e: any) {
            postMessage({ purpose: "sampleReturn", error: e.toString() })
        }

    }
}
