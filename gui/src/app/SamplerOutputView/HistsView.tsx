import { FunctionComponent, useMemo } from "react";
import SequenceHistogramWidget from "./SequenceHistogramWidget";

type HistsViewProps = {
    width: number,
    height: number,
    draws: number[][],
    paramNames: string[]
    drawChainIds: number[]
}

const HistsView: FunctionComponent<HistsViewProps> = ({ width, height, draws, paramNames, drawChainIds }) => {
    const paramNamesResorted = useMemo(() => {
        // put the names that don't end with __ first
        const names = paramNames.filter((name) => !name.endsWith('__'));
        const namesWithSuffix = paramNames.filter((name) => name.endsWith('__'));
        return [...names, ...namesWithSuffix];
    }, [paramNames]);
    return (
        <div style={{position: 'absolute', width, height, overflowY: 'auto', display: 'flex', flexWrap: 'wrap'}}>
            {
                paramNamesResorted.map((paramName) => (
                    <SequenceHist
                        key={paramName}
                        width={300}
                        height={300}
                        variableName={paramName}
                        columnIndex={paramNames.indexOf(paramName)}
                        draws={draws}
                        drawChainIds={drawChainIds}
                    />
                ))
            }
        </div>
    )
}

type SequenceHistProps = {
    width: number,
    height: number,
    variableName: string,
    draws: number[][]
    columnIndex: number
    drawChainIds: number[]
}

const SequenceHist: FunctionComponent<SequenceHistProps> = ({ width, height, variableName, draws, columnIndex }) => {
    return (
        <SequenceHistogramWidget
            histData={draws[columnIndex]}
            title={variableName}
            variableName={variableName}
            width={width}
            height={height}
        />
    )
}

export default HistsView;