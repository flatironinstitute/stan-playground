import Grid from "@mui/material/Grid";
import SequenceHistogramWidget from "@SpComponents/SequenceHistogramWidget";
import { FunctionComponent, useMemo } from "react";

type HistsViewProps = {
  draws: number[][];
  paramNames: string[];
  drawChainIds: number[];
};

const HistsView: FunctionComponent<HistsViewProps> = ({
  draws,
  paramNames,
}) => {
  const paramNamesResorted = useMemo(() => {
    // put the names that don't end with __ first
    const names = paramNames.filter((name) => !name.endsWith("__"));
    const namesWithSuffix = paramNames.filter((name) => name.endsWith("__"));
    return [...names, ...namesWithSuffix];
  }, [paramNames]);
  return (
    <Grid container spacing={2}>
      {paramNamesResorted.map((paramName) => (
        <Grid item sm={12} lg={4} key={paramName}>
          <SequenceHistogramWidget
            histData={draws[paramNames.indexOf(paramName)]}
            title={paramName}
            variableName={paramName}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default HistsView;
