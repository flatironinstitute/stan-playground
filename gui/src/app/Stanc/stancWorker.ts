import { StancFunction, IncomingMessage, Replies, Requests } from "./Types";

import rawStancJS from "./stanc.js?raw";

let stanc: undefined | StancFunction;
try {
    // stanc.js code is not a module, so most nice options for loading are unavailable
    eval(rawStancJS);
    stanc = (globalThis as any).stanc;
    console.log("loaded stanc.js");
} catch (e) {
    console.error("Failed to load stanc.js");
    console.error(e);
}

let requestNumber = 0;

onmessage = function (e: MessageEvent<IncomingMessage>) {
    const { purpose, name, code } = e.data;

    if (!stanc) {
        this.postMessage({ error: "stanc.js failed to load!" });
        return;
    }

    const args = [`filename-in-msg=${name}`, "auto-format", "max-line-length=78"];

    const output = stanc(name, code, args);

    if (purpose === Requests.Format) {
        this.postMessage({ purpose: Replies.Formatted, ...output });
    } else if (purpose === Requests.Check) {
        requestNumber++;

        const { errors, warnings, result } = output;
        if (result) {
            this.postMessage({ purpose: Replies.Checked, warnings, requestNumber });
        } else {
            this.postMessage({
                purpose: Replies.Checked,
                errors,
                warnings,
                requestNumber,
            });
        }
    }
};
