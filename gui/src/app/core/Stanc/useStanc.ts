import { useCallback, use, useEffect, useMemo, useState } from "react";

import { UserSettingsContext } from "@SpCore/Settings/UserSettings";
import { CompileContext } from "@SpCore/Compilation/CompileContextProvider";

import {
  StancErrors,
  StancReplyMessage,
  StancRequestMessage,
  StancWorkerRequests,
} from "./Types";
// https://vitejs.dev/guide/assets#importing-script-as-a-worker
// https://vitejs.dev/guide/assets#importing-asset-as-url
import stancWorkerURL from "./stancWorker?worker&url";

const useStanc = (
  modelName: string,
  code: string,
  onFormat: (s: string) => void,
) => {
  const [stancErrors, setStancErrors] = useState<StancErrors>({
    errors: undefined,
    warnings: undefined,
  });
  const [stancWorker, setStancWorker] = useState<Worker | undefined>(undefined);
  const { pedantic } = use(UserSettingsContext);

  const post = useCallback(
    (message: StancRequestMessage) => {
      stancWorker?.postMessage(message);
    },
    [stancWorker],
  );

  const onMessage = useCallback(
    (e: MessageEvent<StancReplyMessage>) => {
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
    },
    [onFormat],
  );

  // worker creation
  useEffect(() => {
    const worker = new Worker(stancWorkerURL, {
      name: "stancWorker",
      type: "module",
    });
    worker.onmessage = onMessage;
    setStancWorker(worker);
    return () => {
      console.log("terminating stanc worker");
      worker.terminate();
    };
  }, [onMessage]);

  // automatic syntax checking
  useEffect(() => {
    post({
      purpose: StancWorkerRequests.CheckSyntax,
      name: modelName,
      code,
      pedantic,
    });
  }, [modelName, code, post, pedantic]);

  // requesting formatting
  const requestFormat = useCallback(() => {
    post({
      purpose: StancWorkerRequests.FormatStanCode,
      name: modelName,
      code,
      pedantic,
    });
  }, [post, modelName, code, pedantic]);

  const { setValidSyntax } = use(CompileContext);
  const validSyntax = useMemo(() => {
    return stancErrors.errors === undefined || stancErrors.errors.length === 0;
  }, [stancErrors]);
  useEffect(() => {
    setValidSyntax(validSyntax);
  }, [validSyntax, setValidSyntax]);

  return { stancErrors, requestFormat };
};

export default useStanc;
