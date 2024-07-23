import SequencePlotWidget from "@SpComponents/SequencePlotWidget";
import { chainColorForIndex } from "@SpComponents/chainColorList";
import { FunctionComponent, useMemo, useState } from "react";
import ReactVisibilitySensor from "react-visibility-sensor";

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
  const [expanded, setExpanded] = useState<boolean>(false);
  return (
    <div>
      <ExpandComponent
        expanded={expanded}
        setExpanded={setExpanded}
        label={variableName}
      />
      {expanded && (
        <SequencePlotChild
          variableName={variableName}
          draws={draws}
          columnIndex={columnIndex}
          drawChainIds={drawChainIds}
        />
      )}
      <div className="SequencePlotPadding" />
    </div>
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
      <ReactVisibilitySensor partialVisibility>
        {({ isVisible }: { isVisible: boolean }) => {
          if (!isVisible) return <div>...</div>;
          return (
            <SequencePlotWidget
              variableName={variableName}
              plotSequences={plotSequences}
            />
          );
        }}
      </ReactVisibilitySensor>
    </div>
  );
};

type ExpandComponentProps = {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  label: string;
};

const ExpandComponent: FunctionComponent<ExpandComponentProps> = ({
  expanded,
  setExpanded,
  label,
}) => {
  return (
    <div
      className="TracePlotExpandComponent"
      onClick={() => setExpanded(!expanded)}
    >
      {expanded ? "▼" : "▶"}&nbsp;
      <span>{label}</span>
    </div>
  );
};

export default TracePlotsView;
