import {
  StancErrors,
  StancReplyMessage,
  StancWorkerRequests,
} from "@SpStanc/Types";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
// https://vitejs.dev/guide/assets#importing-script-as-a-worker
// https://vitejs.dev/guide/assets#importing-asset-as-url
import stancWorkerURL from "@SpStanc/stancWorker?worker&url";
import { CompileContext } from "@SpCompilation/CompileContext";

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
      if (result) {
        // only format requests return a result
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

  const { setValidSyntax } = useContext(CompileContext);
  const validSyntax = useMemo(() => {
    return stancErrors.errors === undefined;
  }, [stancErrors]);
  useEffect(() => {
    setValidSyntax(validSyntax);
  }, [validSyntax, setValidSyntax]);

  return { stancErrors, requestFormat };
};

export default useStanc;
