import {
  StancFunction,
  StancReplyMessage,
  StancRequestMessage,
  StancWorkerRequests,
} from "@SpStanc/Types";
import rawStancJS from "@SpStanc/stanc.js?raw"; // https://vitejs.dev/guide/assets#importing-asset-as-string
import { isMonacoWorkerNoise } from "@SpUtil/isMonacoWorkerNoise";
import { unreachable } from "@SpUtil/unreachable";

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
  if (stanc) {
    const stanc_version = stanc("", "", ["version"]).result;
    console.log(`loaded stanc.js, version '${stanc_version}'`);
  } else {
    console.error("Failed to load stanc.js");
  }
} catch (e) {
  console.error("Failed to load stanc.js");
  console.error(e);
}

// helper alias for type safety
const postReply = (message: StancReplyMessage) => self.postMessage(message);

self.onmessage = (e: MessageEvent<StancRequestMessage>) => {
  if (isMonacoWorkerNoise(e.data)) {
    return;
  }

  const { purpose, name, code } = e.data;

  if (!stanc) {
    postReply({ fatal: "stanc.js not loaded!" });
    return;
  }

  // stanc accepts the name (unused for our purposes, affects C++ code generation),
  // model code, and arguments. These arguments are the same as supported by the
  // stanc CLI, just without the leading "--".
  const args = [`filename-in-msg=${name}`, "auto-format", "max-line-length=78"];
  // The return will include 'warnings', a list of compiler warnings, and then one of
  // 'result' which is either the generated C++ code or the formatted model, or
  // 'errors', which is a list of compiler errors. In practice, 'errors' only contains
  // a single error
  const output = stanc(name, code, args);

  switch (purpose) {
    case StancWorkerRequests.FormatStanCode: {
      postReply(output);
      break;
    }
    case StancWorkerRequests.CheckSyntax: {
      // if we just syntax checked, don't send back formatted code
      const { errors, warnings } = output;
      postReply({ errors, warnings });
      break;
    }
    default:
      unreachable(purpose);
  }
};
