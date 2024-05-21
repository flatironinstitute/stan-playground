import React, { FunctionComponent, Suspense, useMemo } from "react";

type Props = {
	histData: number[]
	title: string
	variableName: string
	width: number
	height: number
}

const Plot = React.lazy(() => (import('react-plotly.js')))

const SequenceHistogramWidget: FunctionComponent<Props> = ({ histData, title, width, height, variableName }) => {
	const data = useMemo(() => (
		{
			x: histData,
			type: 'histogram',
			nbinsx: Math.ceil(1.5 * Math.sqrt(histData.length)),
			marker: {color: '#505060'}
		} as any // had to do it this way because ts was not recognizing nbinsx
	), [histData])
	return (
		<div style={{ position: 'relative', width, height }}>
			<Suspense fallback={<div>Loading plotly</div>}>
				<Plot
					data={[data]}
					layout={{
						width: width,
						height,
						title: {text: title, font: {size: 12}},
						xaxis: {title: variableName},
						yaxis: {title: 'Count'},
						margin: {r: 0}
					}}
				/>
			</Suspense>
		</div>
	)
}

export default SequenceHistogramWidget
