import { SmallIconButton } from "@fi-sci/misc"
import { Download } from "@mui/icons-material"
import { FunctionComponent, useCallback, useMemo, useState } from "react"
import StanSampler from "../StanSampler/StanSampler"
import { useSamplerOutput } from "../StanSampler/useStanSampler"
import TabWidget from "../TabWidget/TabWidget"
import PlotsView from "./PlotsView"

type SamplerOutputViewProps = {
    width: number
    height: number
    sampler: StanSampler
}

const SamplerOutputView: FunctionComponent<SamplerOutputViewProps> = ({width, height, sampler}) => {
    const {draws, paramNames, numChains} = useSamplerOutput(sampler)

    if (!draws || !paramNames || !numChains) return (
        <span />
    )
    return (
        <DrawsDisplay
            width={width}
            height={height}
            draws={draws}
            paramNames={paramNames}
            numChains={numChains}
        />
    )
}

type DrawsDisplayProps = {
    width: number,
    height: number,
    draws: number[][],
    numChains: number,
    paramNames: string[]
}

const tabs = [
    {
        id: 'summary',
        label: 'Summary',
        title: 'Summary view',
        closeable: false
    },
    {
        id: 'draws',
        label: 'Draws',
        title: 'Draws view',
        closeable: false
    },
    {
        id: 'plots',
        label: 'Plots',
        title: 'Plots view',
        closeable: false
    }
]

const DrawsDisplay: FunctionComponent<DrawsDisplayProps> = ({ width, height, draws, paramNames, numChains }) => {

    const [currentTabId, setCurrentTabId] = useState('summary');

    const drawChainIds = useMemo(() => {
        return [...new Array(draws[0].length).keys()].map(i => 1 + Math.floor(i / draws[0].length * numChains));
    }, [draws, numChains]);

    const drawNumbers: number[] = useMemo(() => {
        const numDrawsPerChain = Math.floor(draws[0].length / numChains);
        return [...new Array(draws[0].length).keys()].map(i => 1 + (i % numDrawsPerChain));
    }, [draws, numChains]);

    return (
        <TabWidget
            width={width}
            height={height}
            tabs={tabs}
            currentTabId={currentTabId}
            setCurrentTabId={setCurrentTabId}
        >
            <SummaryView
                draws={draws}
                paramNames={paramNames}
                drawChainIds={drawChainIds}
            />
            <DrawsView
                width={0}
                height={0}
                draws={draws}
                paramNames={paramNames}
                drawChainIds={drawChainIds}
                drawNumbers={drawNumbers}
            />
            <PlotsView
                width={0}
                height={0}
                draws={draws}
                paramNames={paramNames}
                drawChainIds={drawChainIds}
            />
        </TabWidget>
    )
}

type SummaryViewProps = {
    draws: number[][],
    paramNames: string[]
    drawChainIds: number[]
}

const SummaryView: FunctionComponent<SummaryViewProps> = ({ draws, paramNames, drawChainIds }) => {
    const uniqueChainIds = useMemo(() => (Array.from(new Set(drawChainIds)).sort()), [drawChainIds]);
    const {means} = useMemo(() => {
        const means: { [k: string]: number }[] = [];
        for (let ic = 0; ic < uniqueChainIds.length; ic++) {
            const drawsForChain = draws.map((draw, i) => draw.filter((_, j) => drawChainIds[j] === uniqueChainIds[ic]));
            const meansForChain: { [k: string]: number } = {};
            for (const [i, element] of paramNames.entries()) {
                let sum = 0;
                for (const draw of drawsForChain[i]) {
                    sum += draw;
                }
                meansForChain[element] = sum / drawsForChain.length;
            }
            means.push(meansForChain);
        }
        return {means};
    }, [draws, paramNames, drawChainIds, uniqueChainIds]);

    return (
        <table className="scientific-table">
            <thead>
                <tr>
                    <th>Parameter</th>
                    {
                        uniqueChainIds.map((chainId, i) => (
                            <th key={i}>Chain {chainId}</th>
                        ))
                    }
                </tr>
            </thead>
            <tbody>
                {
                    paramNames.map((paramName, i) => (
                        <tr key={i}>
                            <td>{paramName}</td>
                            {
                                uniqueChainIds.map((_, j) => (
                                    <td key={j}>{means[j][paramName].toPrecision(4)}</td>
                                ))
                            }
                        </tr>
                    ))
                }
            </tbody>
        </table>
    )
}

type DrawsViewProps = {
    width: number
    height: number
    draws: number[][],
    paramNames: string[]
    drawChainIds: number[]
    drawNumbers: number[]
}

const DrawsView: FunctionComponent<DrawsViewProps> = ({ width, height, draws, paramNames, drawChainIds, drawNumbers }) => {
    const [abbreviatedToNumRows, setAbbreviatedToNumRows] = useState<number | undefined>(300);
    const draws2 = useMemo(() => {
        if (abbreviatedToNumRows === undefined) return draws;
        return draws.map(draw => draw.slice(0, abbreviatedToNumRows));
    }, [draws, abbreviatedToNumRows]);
    const handleExportToCsv = useCallback(() => {
        const csvText = prepareCsvText(draws, paramNames, drawChainIds, drawNumbers);
        downloadTextFile(csvText, 'draws.csv');
    }, [draws, paramNames, drawChainIds, drawNumbers]);
    return (
        <div style={{position: 'absolute', width, height, overflow: 'auto'}}>
            <SmallIconButton
                icon={<Download />}
                label="Export to .csv"
                onClick={handleExportToCsv}
            />
            <table className="draws-table">
                <thead>
                    <tr>
                        <th key="chain">Chain</th>
                        <th key="draw">Draw</th>
                        {
                            paramNames.map((name, i) => (
                                <th key={i}>{name}</th>
                            ))
                        }
                    </tr>
                </thead>
                <tbody>
                    {
                        draws2[0].map((_, i) => (
                            <tr key={i}>
                                <td>{drawChainIds[i]}</td>
                                <td>{drawNumbers[i]}</td>
                                {
                                    draws.map((draw, j) => (
                                        <td key={j}>{draw[i]}</td>
                                    ))
                                }
                            </tr>
                        ))
                    }
                </tbody>
            </table>
            {
                abbreviatedToNumRows !== undefined && abbreviatedToNumRows < draws[0].length && (
                    <div style={{background: 'white', padding: 5}}>
                        <button onClick={() => {
                            setAbbreviatedToNumRows(x => (x || 0) + 300)
                        }}>Show more</button>
                    </div>
                )
            }
        </div>
    )
}

const prepareCsvText = (draws: number[][], paramNames: string[], drawChainIds: number[], drawNumbers: number[]) => {
    const lines = draws[0].map((_, i) => {
        return [`${drawChainIds[i]}`, `${drawNumbers[i]}`, ...paramNames.map((_, j) => draws[j][i])].join(',')
    })
    return [['Chain', 'Draw', ...paramNames].join(','), ...lines].join('\n')
}

const downloadTextFile = (text: string, filename: string) => {
    const blob = new Blob([text], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
}

export default SamplerOutputView