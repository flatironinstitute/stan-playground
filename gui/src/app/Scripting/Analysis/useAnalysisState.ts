import {
  InterpreterStatus,
  isInterpreterBusy,
} from "@SpScripting/InterpreterTypes";
import { StanRun } from "@SpStanSampler/useStanSampler";
import { useEffect, useMemo, useRef, useState } from "react";

export type GlobalDataForAnalysis = {
  draws: number[][];
  paramNames: string[];
  numChains: number;
};

const useAnalysisState = (latestRun: StanRun) => {
  const consoleRef = useRef<HTMLDivElement | null>(null);
  const imagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (imagesRef.current) {
      imagesRef.current.innerHTML = "";
    }
    if (consoleRef.current) {
      consoleRef.current.innerHTML = "";
    }
  }, [latestRun.draws]);

  const { draws, paramNames, samplingOpts, status: samplerStatus } = latestRun;
  const numChains = samplingOpts?.num_chains;
  const spData = useMemo(() => {
    if (samplerStatus === "completed" && draws && numChains && paramNames) {
      return {
        draws,
        paramNames,
        numChains,
      };
    } else {
      return undefined;
    }
  }, [samplerStatus, draws, numChains, paramNames]);

  const [status, setStatus] = useState<InterpreterStatus>("idle");

  const [runnable, setRunnable] = useState<boolean>(true);
  const [notRunnableReason, setNotRunnableReason] = useState<string>("");

  const isDataDefined = useMemo(() => spData !== undefined, [spData]);

  useEffect(() => {
    if (!isDataDefined) {
      setRunnable(false);
      setNotRunnableReason("Run sampler first.");
    } else if (isInterpreterBusy(status)) {
      setRunnable(false);
      setNotRunnableReason("");
    } else {
      setRunnable(true);
      setNotRunnableReason("");
    }
  }, [isDataDefined, status]);

  return {
    consoleRef,
    imagesRef,
    spData,
    status,
    onStatus: setStatus,
    runnable,
    notRunnableReason,
  };
};

export default useAnalysisState;