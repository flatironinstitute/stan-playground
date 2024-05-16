import { FunctionComponent, useCallback } from "react";
import { SamplingOpts, defaultSamplingOpts } from "../StanSampler/StanSampler";
import { Hyperlink } from "@fi-sci/misc";

type SamplingOptsPanelProps = {
    samplingOpts: SamplingOpts;
    setSamplingOpts?: (opts: SamplingOpts) => void;
}

// From Brian
// The following would be nice to have control over:

// [ ]Number of chains (default 4, in practice I think this being a slider from 1 to 8 is probably reasonable, but in theory it can be unbounded)
//  Number of warmup iterations (default 1000, can be [0,
// ))
//  Number of sampling iterations (default 1000, can be [1,
// ))
//  Initializations. This is tricky, can either be 1 json object or a list of num_chains JSON objects.
//  "Initialization radius" (parameters not given an initial value directly are drawn from uniform(-R, R) on the unconstrained scale) (default 2.0, can be [0,
// ), but in practice limiting to say 10 in the UI is probably fine)
//  Seed. Any uint32.


const SamplingOptsPanel: FunctionComponent<SamplingOptsPanelProps> = ({ samplingOpts, setSamplingOpts }) => {
    const num_chains = samplingOpts.num_chains;
    const readOnly = !setSamplingOpts;
    const handleReset = useCallback(() => {
        setSamplingOpts && setSamplingOpts(defaultSamplingOpts)
    }, [setSamplingOpts])
    return (
        <div>
            <table>
                <tbody>
                    <tr>
                        <td># chains</td>
                        <td>
                            <IntEdit
                                value={num_chains}
                                onChange={(value) => setSamplingOpts && setSamplingOpts({ ...samplingOpts, num_chains: value })}
                                min={1}
                                max={8}
                                readOnly={readOnly}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td># warmup</td>
                        <td>
                            <IntEdit
                                value={samplingOpts.num_warmup}
                                onChange={(value) => setSamplingOpts && setSamplingOpts({ ...samplingOpts, num_warmup: value })}
                                min={0}
                                readOnly={readOnly}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td># samples</td>
                        <td>
                            <IntEdit
                                value={samplingOpts.num_samples}
                                onChange={(value) => setSamplingOpts && setSamplingOpts({ ...samplingOpts, num_samples: value })}
                                min={1}
                                readOnly={readOnly}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>init radius</td>
                        <td>
                            <FloatEdit
                                value={samplingOpts.init_radius}
                                onChange={(value) => setSamplingOpts && setSamplingOpts({ ...samplingOpts, init_radius: value })}
                                min={0}
                                readOnly={readOnly}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
            <div>
                <Hyperlink onClick={handleReset} color="gray">reset</Hyperlink>
            </div>
        </div>
    )
}

type InitEditProps = {
    value: number;
    onChange: (value: number) => void;
    min: number;
    max?: number;
    readOnly: boolean;
}

const IntEdit: FunctionComponent<InitEditProps> = ({ value, onChange, min, max, readOnly }) => {
    return (
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            min={min}
            max={max}
            readOnly={readOnly}
            style={{ width: "4em" }}
        />
    )
}

type FloatEditProps = {
    value: number;
    onChange: (value: number) => void;
    min: number;
    max?: number;
    readOnly: boolean;
}

const FloatEdit: FunctionComponent<FloatEditProps> = ({ value, onChange, min, max, readOnly }) => {
    return (
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            min={min}
            max={max}
            readOnly={readOnly}
            style={{ width: "4em" }}
        />
    )
}

export default SamplingOptsPanel;