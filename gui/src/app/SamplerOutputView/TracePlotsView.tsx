import { FunctionComponent, useMemo, useState } from "react";
import SequencePlotWidget from "./SequencePlotWidget";
import { chainColorForIndex } from "./chainColorList";
import ReactVisibilitySensor from "react-visibility-sensor";

type TracePlotsViewProps = {
    width: number,
    height: number,
    draws: number[][],
    paramNames: string[]
    drawChainIds: number[]
}

const TracePlotsView: FunctionComponent<TracePlotsViewProps> = ({ width, height, draws, paramNames, drawChainIds }) => {
    const plotHeight = Math.max(150, Math.min(400, height / 2));
    return (
        <div style={{position: 'absolute', width, height, overflowY: 'auto'}}>
            {
                paramNames.map((paramName, i) => (
                    <SequencePlot
                        key={paramName}
                        width={width - 40}
                        height={plotHeight}
                        variableName={paramName}
                        columnIndex={i}
                        draws={draws}
                        drawChainIds={drawChainIds}
                    />
                ))
            }
        </div>
    )
}

type SequencePlotProps = {
    width: number,
    height: number,
    variableName: string,
    draws: number[][]
    columnIndex: number
    drawChainIds: number[]
}

const SequencePlot: FunctionComponent<SequencePlotProps> = ({ width, height, variableName, draws, columnIndex, drawChainIds }) => {
    const [expanded, setExpanded] = useState<boolean>(false);
    return (
        <div>
            <ExpandComponent
                width={width}
                expanded={expanded}
                setExpanded={setExpanded}
                label={variableName}
            />
            {
                expanded && (
                    <SequencePlotChild
                        width={width}
                        height={height}
                        variableName={variableName}
                        draws={draws}
                        columnIndex={columnIndex}
                        drawChainIds={drawChainIds}
                    />
                )
            }
            <div style={{height: 4}} />
        </div>
    )
}

const SequencePlotChild: FunctionComponent<SequencePlotProps> = ({ width, height, variableName, draws, columnIndex, drawChainIds }) => {
    const plotSequences = useMemo(() => {
        const uniqueChainIds = Array.from(new Set(drawChainIds)).sort();
        return uniqueChainIds.map((chainId, ii) => {
            return {
                label: `Chain ${chainId}`,
                data: draws[columnIndex].filter((_, i) => drawChainIds[i] === chainId),
                color: chainColorForIndex(ii)
            }
        }, [draws, columnIndex])
    }, [draws, columnIndex, drawChainIds])
    return (
        <div style={{position: 'relative', width, height}}>
            <ReactVisibilitySensor partialVisibility>
                {({isVisible}: {isVisible: boolean}) => {
                    if (!isVisible) return <div>...</div>
                    return (
                        <SequencePlotWidget
                            width={width}
                            height={height}
                            variableName={variableName}
                            plotSequences={plotSequences}
                        />
                    )
                }}
            </ReactVisibilitySensor>
        </div>
    )
}

type ExpandComponentProps = {
    width: number
    expanded: boolean
    setExpanded: (expanded: boolean) => void
    label: string
}

const ExpandComponent: FunctionComponent<ExpandComponentProps> = ({ width, expanded, setExpanded, label }) => {
    return (
        <div style={{width, height: 25, paddingTop: 5, paddingLeft: 5, cursor: 'pointer', backgroundColor: 'lightgray'}} onClick={() => setExpanded(!expanded)}>
            {expanded ? '▼' : '▶'}&nbsp;
            <span>{label}</span>
        </div>
    )
}

export default TracePlotsView;