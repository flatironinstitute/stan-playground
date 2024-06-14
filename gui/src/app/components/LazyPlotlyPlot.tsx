import React, { FunctionComponent, Suspense } from 'react'

import type { PlotParams } from 'react-plotly.js';
const Plot = React.lazy(() => (import('react-plotly.js')))

const LazyPlotlyPlot: FunctionComponent<PlotParams> = ({ data, layout }) => {
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