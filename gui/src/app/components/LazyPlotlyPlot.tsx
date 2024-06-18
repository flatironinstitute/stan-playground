import React, { FunctionComponent, Suspense } from 'react'

import type { PlotParams } from 'react-plotly.js';
import createPlotlyComponent from "react-plotly.js/factory";
const Plot = React.lazy(async () => {
	const plotly = await import('plotly.js-cartesian-dist');
	return {default: createPlotlyComponent(plotly)};
})

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
