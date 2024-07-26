import { StanRun } from "@SpStanSampler/useStanSampler";
import { useEffect, useMemo, useRef, useState } from "react";
import { InterpreterStatus } from "../InterpreterTypes";

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

  return { consoleRef, imagesRef, spData, status, onStatus: setStatus };
};

export default useAnalysisState;
