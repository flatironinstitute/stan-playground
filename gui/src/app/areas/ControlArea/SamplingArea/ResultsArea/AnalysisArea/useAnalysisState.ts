import { FileNames } from "@SpCore/Project/FileMapping";
import {
  InterpreterStatus,
  isInterpreterBusy,
} from "@SpCore/Scripting/InterpreterTypes";
import { clearOutputDivs } from "@SpCore/Scripting/OutputDivUtils";
import { SamplerState } from "@SpCore/StanSampler/SamplerTypes";
import { encodeTextFile } from "@SpUtil/files";
import { useEffect, useMemo, useRef, useState } from "react";

export type GlobalDataForAnalysis = {
  draws: number[][];
  paramNames: string[];
  numChains: number;
};

// A custom hook to share logic between the Python and R analysis windows
// This contains the output div refs, the interpreter state, and the data from
// the latest run.
const useAnalysisState = (samplerState: SamplerState) => {
  const consoleRef = useRef<HTMLDivElement | null>(null);
  const imagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    clearOutputDivs(consoleRef, imagesRef);
  }, [samplerState.latestRun?.draws]);

  const { latestRun: runResult, status: samplerStatus } = samplerState;
  const { draws, paramNames, sampleConfig: samplingOpts } = runResult || {};
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
  const isDataDefined = useMemo(() => spData !== undefined, [spData]);
  const runnable = isDataDefined && !isInterpreterBusy(status);
  const notRunnableReason = !isDataDefined ? "Run sampler first." : "";

  const files = useMemo(() => {
    if (samplingOpts?.data === undefined) {
      return undefined;
    } else {
      return [encodeTextFile(FileNames.DATAFILE, samplingOpts.data)];
    }
  }, [samplingOpts]);

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
