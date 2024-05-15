import { SmallIconButton } from "@fi-sci/misc"
import { Download } from "@mui/icons-material"
import { FunctionComponent, useCallback, useMemo, useState } from "react"
import StanSampler from "../StanSampler/StanSampler"
import { useSamplerOutput } from "../StanSampler/useStanSampler"
import TabWidget from "../TabWidget/TabWidget"

type SamplerOutputViewProps = {
    width: number
    height: number
    sampler: StanSampler
}

const SamplerOutputView: FunctionComponent<SamplerOutputViewProps> = ({width, height, sampler}) => {
    const {draws, paramNames} = useSamplerOutput(sampler)

    if (!draws || !paramNames) return (
        <span />
    )
    return (
        <DrawsDisplay
            width={width}
            height={height}
            draws={draws}
            paramNames={paramNames}
        />
    )
}

type DrawsDisplayProps = {
    width: number,
    height: number,
    draws: number[][],
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
    }
]

const DrawsDisplay: FunctionComponent<DrawsDisplayProps> = ({ width, height, draws, paramNames }) => {

    const [currentTabId, setCurrentTabId] = useState('summary');

    const means: { [k: string]: number } = {};

    for (const [i, element] of paramNames.entries()) {
        let sum = 0;
        for (const draw of draws[i]) {
            sum += draw;
        }
        means[element] = sum / draws[i].length;
    }

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
            />
            <DrawsView
                width={0}
                height={0}
                draws={draws}
                paramNames={paramNames}
            />
        </TabWidget>
    )
}

type SummaryViewProps = {
    draws: number[][],
    paramNames: string[]
}

const SummaryView: FunctionComponent<SummaryViewProps> = ({ draws, paramNames }) => {
    const {means} = useMemo(() => {
        const means: { [k: string]: number } = {};
        for (const [i, element] of paramNames.entries()) {
            let sum = 0;
            for (const draw of draws[i]) {
                sum += draw;
            }
            means[element] = sum / draws[i].length;
        }
        return {means};
    }, [draws, paramNames]);

    return (
        <table className="scientific-table">
            <thead>
                <tr>
                    <th>Parameter</th>
                    <th>Mean</th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(means).map(([name, mean]) => (
                    <tr key={name}>
                        <td>{name}</td>
                        <td>{mean}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

type DrawsViewProps = {
    width: number
    height: number
    draws: number[][],
    paramNames: string[]
}

const DrawsView: FunctionComponent<DrawsViewProps> = ({ width, height, draws, paramNames }) => {
    const [abbreviatedToNumRows, setAbbreviatedToNumRows] = useState<number | undefined>(300);
    const draws2 = useMemo(() => {
        if (abbreviatedToNumRows === undefined) return draws;
        return draws.map(draw => draw.slice(0, abbreviatedToNumRows));
    }, [draws, abbreviatedToNumRows]);
    const handleExportToCsv = useCallback(() => {
        const csvText = prepareCsvText(draws, paramNames);
        downloadTextFile(csvText, 'draws.csv');
    }, [draws, paramNames]);
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

const prepareCsvText = (draws: number[][], paramNames: string[]) => {
    const lines = draws[0].map((_, i) => {
        return paramNames.map((_, j) => draws[j][i]).join(',')
    })
    return [paramNames.join(','), ...lines].join('\n')
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