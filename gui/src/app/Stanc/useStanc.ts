import { useCallback, useEffect, useState } from "react";

export type StancErrors = {
  errors?: string[];
  warnings?: string[];
};

type StancWorkerMessage = {
  purpose?: "formatted" | "checked";
  error: string;
  result: string;
} & StancErrors;

const stancWorkerURL = new URL('./stancWorker.ts', import.meta.url);
const stancjsURL = new URL('./stanc.js', import.meta.url);
stancjsURL; // to convince the bundler to actually include this file

const useStanc = (modelName: string, code: string, onFormat: (s: string) => void) => {
  const [stancErrors, setStancErrors] = useState<StancErrors>({});
  const [stancWorker, setStancWorker] = useState<Worker | undefined>(undefined);

  // worker creation
  useEffect(() => {
    const worker = new Worker(stancWorkerURL, { name: "stancWorker" });

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
      if (purpose === 'formatted') {
        if (result) {
          onFormat(result);
        }
      }
    };
  }, [stancWorker, onFormat]);

  // automatic syntax checking
  useEffect(() => {
    stancWorker?.postMessage({ purpose: 'check', name: modelName, code });
  }, [modelName, code, stancWorker]);

  // requesting formatting
  const requestFormat = useCallback(() => {
    stancWorker?.postMessage({ purpose: 'format', name: modelName, code });
  }, [modelName, code, stancWorker]);

  return { stancErrors, requestFormat };
};

export default useStanc;
