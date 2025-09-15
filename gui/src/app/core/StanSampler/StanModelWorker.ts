import { isMonacoWorkerNoise } from "@SpUtil/isMonacoWorkerNoise";
import { unreachable } from "@SpUtil/unreachable";
import StanModel from "tinystan";
import {
  Progress,
  Replies,
  Requests,
  StanModelReplyMessage,
  StanModelRequestMessage,
} from "./SamplerTypes";

const postReply = (message: StanModelReplyMessage) => self.postMessage(message);

const parseProgress = (msg: string): Progress => {
  // Examples (note different spacing):
  // Chain [1] Iteration: 2000 / 2000 [100%]  (Sampling)
  // Chain [2] Iteration:  800 / 2000 [ 40%]  (Warmup)

  // But if there is only one chain, then
  // the "Chain [x]" part is omitted.
  if (msg.startsWith("Iteration:")) {
    msg = "Chain [1] " + msg;
  }
  msg = msg.replace(/\[|\]/g, "");
  const parts = msg.split(/\s+/);
  const chain = parseInt(parts[1]);
  const iteration = parseInt(parts[3]);
  const totalIterations = parseInt(parts[5]);
  const percent = parseInt(parts[6].slice(0, -1));
  const warmup = parts[7] === "(Warmup)";
  return { chain, iteration, totalIterations, percent, warmup };
};

let consoleText = "";
const progressPrintCallback = (msg: string) => {
  if (!msg) {
    return;
  }
  if (!msg.startsWith("Chain") && !msg.startsWith("Iteration:")) {
    // storing this has a not-insignificant overhead when a model
    // has print statements, but is much faster than posting
    // every single line to the main thread
    consoleText += msg + "\n";
    console.log(msg);
    return;
  }
  const report = parseProgress(msg);
  postReply({ purpose: Replies.Progress, report });
};

let model: StanModel;

self.onmessage = (e: MessageEvent<StanModelRequestMessage>) => {
  if (isMonacoWorkerNoise(e.data)) {
    return;
  }

  switch (e.data.purpose) {
    case Requests.Load: {
      import(/* @vite-ignore */ e.data.url)
        .then((js) => StanModel.load(js.default, progressPrintCallback))
        .then((m) => {
          model = m;
          console.log(
            "Web Worker loaded Stan model built from version " +
              m.stanVersion(),
          );
          postReply({ purpose: Replies.ModelLoaded });
        }, console.error);
      break;
    }
    case Requests.Sample: {
      if (!model) {
        postReply({
          purpose: Replies.StanReturn,
          error: "Model not loaded yet!",
        });
        return;
      }
      try {
        consoleText = "";
        const { paramNames, draws } = model.walnuts(e.data.sampleConfig);
        // TODO? use an ArrayBuffer so we can transfer without serialization cost
        postReply({
          purpose: Replies.StanReturn,
          draws,
          paramNames,
          error: null,
          consoleText,
          sampleConfig: e.data.sampleConfig,
        });
      } catch (e: any) {
        postReply({ purpose: Replies.StanReturn, error: e.toString() });
      }
      break;
    }

    default: {
      unreachable(e.data);
    }
  }
};
