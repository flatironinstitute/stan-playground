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
    const readOnly = setSamplingOpts === undefined;
    const handleReset = useCallback(() => {
        setSamplingOpts && setSamplingOpts(defaultSamplingOpts)
    }, [setSamplingOpts])
    return (
        <div>
            <table>
                <tbody>
                    <tr title="Number of sampling chains">
                        <td># chains</td>
                        <td>
                            <NumberEdit
                                value={num_chains}
                                onChange={(value) => setSamplingOpts && setSamplingOpts({ ...samplingOpts, num_chains: value as number })}
                                min={1}
                                max={8}
                                readOnly={readOnly}
                                type="int"
                            />
                        </td>
                    </tr>
                    <tr title="Number of warmup draws per chain">
                        <td># warmup</td>
                        <td>
                            <NumberEdit
                                value={samplingOpts.num_warmup}
                                onChange={(value) => setSamplingOpts && setSamplingOpts({ ...samplingOpts, num_warmup: value as number })}
                                min={0}
                                readOnly={readOnly}
                                type="int"
                            />
                        </td>
                    </tr>
                    <tr title="Number of regular draws per chain">
                        <td># samples</td>
                        <td>
                            <NumberEdit
                                value={samplingOpts.num_samples}
                                onChange={(value) => setSamplingOpts && setSamplingOpts({ ...samplingOpts, num_samples: value as number })}
                                min={1}
                                readOnly={readOnly}
                                type="int"
                            />
                        </td>
                    </tr>
                    <tr title="Radius of the hypercube from which initial values for the model parameters are drawn (I think)">
                        <td>init radius</td>
                        <td>
                            <NumberEdit
                                value={samplingOpts.init_radius}
                                onChange={(value) => setSamplingOpts && setSamplingOpts({ ...samplingOpts, init_radius: value as number })}
                                min={0}
                                readOnly={readOnly}
                                type="float"
                            />
                        </td>
                    </tr>
                    <tr title="Random seed for the sampler. Leave blank for a random seed">
                        <td>seed</td>
                        <td>
                            <NumberEdit
                                value={samplingOpts.seed}
                                onChange={(value) => setSamplingOpts && setSamplingOpts({ ...samplingOpts, seed: value })}
                                min={0}
                                readOnly={readOnly}
                                type="int"
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

type NumberEditProps = {
    value: number | undefined;
    onChange: (value: number | undefined) => void;
    min: number;
    max?: number;
    readOnly: boolean;
    type: 'int' | 'float' | 'intOrUndefined';
}

const NumberEdit: FunctionComponent<NumberEditProps> = ({ value, onChange, min, max, readOnly, type }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newValue: number | undefined;
        switch (type) {
            case 'int':
                newValue = parseInt(e.target.value);
                break;
            case 'float':
                newValue = parseFloat(e.target.value);
                break;
            case 'intOrUndefined':
                newValue = parseInt(e.target.value);
                if (isNaN(newValue)) {
                    newValue = undefined;
                }
                break;
        }
        onChange(newValue);
    };

    return (
        <input
            type="number"
            value={value === undefined ? "" : value}
            onChange={handleChange}
            min={min}
            max={max}
            readOnly={readOnly}
            style={{ width: "4em" }}
        />
    )
}

export default SamplingOptsPanel;