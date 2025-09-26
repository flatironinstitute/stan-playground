import {
  StancReplyMessage,
  StancRequestMessage,
  StancWorkerRequests,
} from "@SpCore/Stanc/Types";
import { isMonacoWorkerNoise } from "@SpUtil/isMonacoWorkerNoise";
import { unreachable } from "@SpUtil/unreachable";

import { stanc, stanc_version } from "stanc3";

if (stanc_version) {
  console.log(`loaded stanc.js, version '${stanc_version}'`);
} else {
  console.error("Failed to load stanc.js");
}

// helper alias for type safety
const postReply = (message: StancReplyMessage) => self.postMessage(message);

self.onmessage = (e: MessageEvent<StancRequestMessage>) => {
  if (isMonacoWorkerNoise(e.data)) {
    return;
  }

  const { purpose, name, code, pedantic } = e.data;

  if (!stanc) {
    postReply({ fatal: "stanc.js not loaded!" });
    return;
  }

  // stanc accepts the name (unused for our purposes, affects C++ code generation),
  // model code, and arguments. These arguments are the same as supported by the
  // stanc CLI, just without the leading "--".
  const args = [`filename-in-msg=${name}`];

  if (purpose === StancWorkerRequests.FormatStanCode) {
    args.push("auto-format");
    args.push("max-line-length=78");
  } else if (pedantic) {
    args.push("warn-pedantic");
  }

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
      postReply({ result: undefined, errors: errors ?? [], warnings });
      break;
    }
    default:
      unreachable(purpose);
  }
};
