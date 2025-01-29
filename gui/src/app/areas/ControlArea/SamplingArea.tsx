import { FunctionComponent, use } from "react";

import { Split } from "@geoffcox/react-splitter";
import Box from "@mui/material/Box";
import { CompileContext } from "@SpCore/Compilation/CompileContextProvider";
import useStanSampler from "@SpCore/StanSampler/useStanSampler";
import ResultsArea from "./SamplingArea/ResultsArea";
import RunArea from "./SamplingArea/RunArea";

const SamplingArea: FunctionComponent = () => {
  const { compiledMainJsUrl } = use(CompileContext);

  const { sampler, latestRun } = useStanSampler(compiledMainJsUrl);

  return (
    <Split horizontal initialPrimarySize="30%" minSecondarySize="10%">
      <RunArea sampler={sampler} latestRun={latestRun} />
      <Box height="100%" display="flex" flexDirection="column">
        <Box flex="1" overflow="hidden">
          <ResultsArea latestRun={latestRun} />
        </Box>
      </Box>
    </Split>
  );
};

export default SamplingArea;
