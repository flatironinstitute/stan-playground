import { useCallback, useEffect, useState } from "react";
import {
  StancReplyMessage,
  StancErrors,
  Replies,
  StancWorkerRequests,
} from "./Types";
import stancWorkerURL from "./stancWorker?worker&url";

const useStanc = (
  modelName: string,
  code: string,
  onFormat: (s: string) => void,
) => {
  const [stancErrors, setStancErrors] = useState<StancErrors>({});
  const [stancWorker, setStancWorker] = useState<Worker | undefined>(undefined);

  // worker creation
  useEffect(() => {
    const worker = new Worker(stancWorkerURL, {
      name: "stancWorker",
      type: "module",
    });
    setStancWorker(worker);
    return () => {
      console.log("terminating stanc worker");
      worker.terminate();
    };
  }, []);

  // message handling
  useEffect(() => {
    if (!stancWorker) return;

    stancWorker.onmessage = (e: MessageEvent<StancReplyMessage>) => {
      if ("fatal" in e.data) {
        // only returned if stanc.js failed to load
        console.error(e.data.fatal);
        return;
      }

      const { result, warnings, errors } = e.data;
      setStancErrors({ warnings, errors });
      if (result) { // only format requests return a result
        onFormat(result);
      }
    };
  }, [stancWorker, onFormat]);

  // automatic syntax checking
  useEffect(() => {
    stancWorker?.postMessage({
      purpose: StancWorkerRequests.CheckSyntax,
      name: modelName,
      code,
    });
  }, [modelName, code, stancWorker]);

  // requesting formatting
  const requestFormat = useCallback(() => {
    stancWorker?.postMessage({
      purpose: StancWorkerRequests.FormatStanCode,
      name: modelName,
      code,
    });
  }, [modelName, code, stancWorker]);

  return { stancErrors, requestFormat };
};

export default useStanc;
