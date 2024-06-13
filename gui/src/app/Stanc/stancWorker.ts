import { StancFunction, IncomingMessage, Replies, Requests } from "./Types";
import rawStancJS from "./stanc.js?raw";

let stanc: undefined | StancFunction;
try {
  // stanc.js code is not a module, so most nice options for loading are unavailable
  eval(rawStancJS);
  // stanc.js also detects if it is running under node, which makes testing annoying
  if (typeof module !== "undefined") {
    // node (default vitest setup)
    stanc = module.exports.stanc;
  } else {
    // browser
    stanc = (globalThis as any).stanc;
  }
  console.log("loaded stanc.js");
} catch (e) {
  console.error("Failed to load stanc.js");
  console.error(e);
}

self.onmessage = (e: MessageEvent<IncomingMessage>) => {
  const { purpose, name, code } = e.data;

  if (!stanc) {
    self.postMessage({ error: "stanc.js not loaded!" });
    return;
  }

  const args = [`filename-in-msg=${name}`, "auto-format", "max-line-length=78"];

  const output = stanc(name, code, args);

  if (purpose === Requests.Format) {
    self.postMessage({ purpose: Replies.Formatted, ...output });
  } else if (purpose === Requests.Check) {
    const { errors, warnings, result } = output;
    if (result) {
      self.postMessage({ purpose: Replies.Checked, warnings });
    } else {
      self.postMessage({
        purpose: Replies.Checked,
        errors,
        warnings,
      });
    }
  }
};
