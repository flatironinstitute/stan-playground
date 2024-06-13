import { useCallback, useEffect, useState } from "react";
import { StancWorkerMessage, StancErrors, Replies, Requests } from "./Types";
import stancWorkerURL from "./stancWorker?worker&url";

const useStanc = (modelName: string, code: string, onFormat: (s: string) => void) => {
  const [stancErrors, setStancErrors] = useState<StancErrors>({});
  const [stancWorker, setStancWorker] = useState<Worker | undefined>(undefined);

  // worker creation
  useEffect(() => {
    const worker = new Worker(stancWorkerURL, { name: "stancWorker", type: "module" });
    setStancWorker(worker);
    return () => {
      console.log("terminating stanc worker")
      worker.terminate();
    };
  }, []);

  // message handling
  useEffect(() => {
    if (!stancWorker) return;

    stancWorker.onmessage = (e: MessageEvent<StancWorkerMessage>) => {
      const { purpose, result, error } = e.data;
      if (error) {
        // not loaded yet
        console.error(error);
        return;
      }
      setStancErrors({ ...e.data });
      if (purpose === Replies.Formatted) {
        if (result) {
          onFormat(result);
        }
      }
    };
  }, [stancWorker, onFormat]);

  // automatic syntax checking
  useEffect(() => {
    stancWorker?.postMessage({ purpose: Requests.Check, name: modelName, code });
  }, [modelName, code, stancWorker]);

  // requesting formatting
  const requestFormat = useCallback(() => {
    stancWorker?.postMessage({ purpose: Requests.Format, name: modelName, code });
  }, [modelName, code, stancWorker]);

  return { stancErrors, requestFormat };
};

export default useStanc;
