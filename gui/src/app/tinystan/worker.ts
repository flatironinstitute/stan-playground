import StanModel from "./StanModel";

let model: StanModel;

onmessage = function (e) {
    const purpose = e.data.purpose;

    if (purpose === "load") {

        import(/* @vite-ignore */ e.data.url)
            .then(
                js => StanModel.load(js.default, null))
            .then(
                m => {
                    model = m
                    console.log(m.stanVersion());
                    postMessage({ purpose: "modelLoaded" })
                });


    } else if (purpose === "sample") {
        console.log(e.data);
        if (!model) return;
        const ret = model.sample(e.data.sampleConfig)
        console.log(ret);
        postMessage({ purpose: "sampleReturn", draws: ret });
    }
}
