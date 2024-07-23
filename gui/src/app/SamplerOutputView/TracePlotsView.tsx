import SequencePlotWidget from "@SpComponents/SequencePlotWidget";
import { chainColorForIndex } from "@SpComponents/chainColorList";
import { ArrowDropDown } from "@mui/icons-material";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import { FunctionComponent, useMemo } from "react";

type TracePlotsViewProps = {
  draws: number[][];
  paramNames: string[];
  drawChainIds: number[];
};

const TracePlotsView: FunctionComponent<TracePlotsViewProps> = ({
  draws,
  paramNames,
  drawChainIds,
}) => {
  return (
    <div className="TracePlotsView">
      {paramNames.map((paramName, i) => (
        <SequencePlot
          key={paramName}
          variableName={paramName}
          columnIndex={i}
          draws={draws}
          drawChainIds={drawChainIds}
        />
      ))}
    </div>
  );
};

type SequencePlotProps = {
  variableName: string;
  draws: number[][];
  columnIndex: number;
  drawChainIds: number[];
};

const SequencePlot: FunctionComponent<SequencePlotProps> = ({
  variableName,
  draws,
  columnIndex,
  drawChainIds,
}) => {
  return (
    <Accordion slotProps={{ transition: { unmountOnExit: true } }}>
      <AccordionSummary expandIcon={<ArrowDropDown />}>
        {variableName}
      </AccordionSummary>
      <AccordionDetails>
        <SequencePlotChild
          variableName={variableName}
          draws={draws}
          columnIndex={columnIndex}
          drawChainIds={drawChainIds}
        />
      </AccordionDetails>
    </Accordion>
  );
};

const SequencePlotChild: FunctionComponent<SequencePlotProps> = ({
  variableName,
  draws,
  columnIndex,
  drawChainIds,
}) => {
  const plotSequences = useMemo(() => {
    const uniqueChainIds = Array.from(new Set(drawChainIds)).sort();
    return uniqueChainIds.map(
      (chainId, ii) => {
        return {
          label: `Chain ${chainId}`,
          data: draws[columnIndex].filter(
            (_, i) => drawChainIds[i] === chainId,
          ),
          color: chainColorForIndex(ii),
        };
      },
      [draws, columnIndex],
    );
  }, [draws, columnIndex, drawChainIds]);
  return (
    <div className="SequencePlotChild">
      <SequencePlotWidget
        variableName={variableName}
        plotSequences={plotSequences}
      />
    </div>
  );
};

export default TracePlotsView;
