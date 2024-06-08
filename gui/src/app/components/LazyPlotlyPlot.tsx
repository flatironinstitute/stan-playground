import React, { FunctionComponent, Suspense } from 'react'

const Plot = React.lazy(() => (import('react-plotly.js')))

type LazyPlotlyPlotProps = {
	data: any[]
	layout: any
}

const LazyPlotlyPlot: FunctionComponent<LazyPlotlyPlotProps> = ({ data, layout }) => {
	return (
		<Suspense fallback={<div>Loading plotly</div>}>
			<Plot
				data={data}
				layout={layout}
			/>
		</Suspense>
	)
}

export default LazyPlotlyPlot