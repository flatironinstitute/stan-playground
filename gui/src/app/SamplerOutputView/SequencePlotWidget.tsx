import React, { FunctionComponent, Suspense, useMemo } from "react";

export type PlotSequence = {
	label: string
	data: number[]
	color: string
}

type Props = {
	plotSequences: PlotSequence[]
	variableName: string
	highlightDrawRange?: [number, number]
	width: number
	height: number
}

const Plot = React.lazy(() => (import('react-plotly.js')))

const SequencePlotWidget: FunctionComponent<Props> = ({ plotSequences, variableName, highlightDrawRange, width, height }) => {
	const shapes = useMemo(() => (
		(highlightDrawRange ? (
			[{type: 'rect', x0: highlightDrawRange[0], x1: highlightDrawRange[1], y0: 0, y1: 1, yref: 'paper', fillcolor: 'yellow', opacity: 0.1}]
		) : []) as any
	), [highlightDrawRange])
	return (
		<div style={{ position: 'relative', width, height }}>
			<Suspense fallback={<div>Loading plotly</div>}>
				<Plot
					data={
						plotSequences.map(ps => (
							{
								x: [...new Array(ps.data.length).keys()].map(i => (i + 1)),
								y: ps.data,
								type: 'scatter',
								mode: 'lines+markers',
								marker: {color: ps.color}
							}
						))
					}
					layout={{
						width: width,
						height,
						title: '',
						yaxis: {title: variableName},
						xaxis: {title: 'draw'},
						shapes,
						margin: {
							t: 30, b: 40, r: 0
						},
						showlegend: false
					}}
				/>
			</Suspense>
		</div>
	)
}

export default SequencePlotWidget
