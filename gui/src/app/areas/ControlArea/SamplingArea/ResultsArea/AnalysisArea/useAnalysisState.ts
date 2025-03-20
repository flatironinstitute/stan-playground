import { FileNames } from "@SpCore/Project/FileMapping";
import {
  InterpreterStatus,
  isInterpreterBusy,
} from "@SpCore/Scripting/InterpreterTypes";
import { clearOutputDivs } from "@SpCore/Scripting/OutputDivUtils";
import { StanRun } from "@SpCore/StanSampler/useStanSampler";
import { useEffect, useMemo, useRef, useState } from "react";

export type GlobalDataForAnalysis = {
  draws: number[][];
  paramNames: string[];
  numChains: number;
};

// A custom hook to share logic between the Python and R analysis windows
// This contains the output div refs, the interpreter state, and the data from
// the latest run.
const useAnalysisState = (latestRun: StanRun) => {
  const consoleRef = useRef<HTMLDivElement | null>(null);
  const imagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    clearOutputDivs(consoleRef, imagesRef);
  }, [latestRun.runResult?.draws]);

  const { runResult, status: samplerStatus } = latestRun;
  const { draws, paramNames, samplingOpts } = runResult || {};
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

  const files = useMemo(() => {
    if (samplingOpts?.data === undefined) {
      return undefined;
    } else {
      return {
        [FileNames.DATAFILE]: samplingOpts.data,
      };
    }
  }, [samplingOpts?.data]);

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
    files,
  };
};

export default useAnalysisState;
