
let stanc: undefined
    | ((
        name: string,
        code: string,
        args: string[],
    ) => {
        errors?: string[];
        warnings?: string[];
        result?: string;
    });


try {
    // importScripts works like a script tag, but we get scoping naturally from the worker
    importScripts('./stanc.js');
    stanc = (globalThis as any).stanc;
    console.log("loaded stanc.js");
} catch (e) {
    console.error("Failed to load stanc.js");
    console.error(e);
}

let requestNumber = 0;

onmessage = function (e) {
    const { purpose, name, code } = e.data;

    if (!stanc) {
        postMessage({ error: "stanc.js not loaded yet!" });
        return;
    }

    const args = [`filename-in-msg=${name}`, "auto-format", "max-line-length=78"];

    const output = stanc(name, code, args);

    if (purpose === "format") {
        this.postMessage({ purpose: "formatted", ...output });
    } else if (purpose === "check") {
        requestNumber++;

        const { errors, warnings, result } = output;
        if (result) {
            this.postMessage({ purpose: "checked", warnings, requestNumber });
        } else {
            this.postMessage({
                purpose: "checked",
                errors,
                warnings,
                requestNumber,
            });
        }
    }
};
