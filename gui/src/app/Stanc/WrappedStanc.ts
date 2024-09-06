import { StancFunction } from "@SpStanc/Types";
import rawStancJS from "@SpStanc/stanc.js?raw"; // https://vitejs.dev/guide/assets#importing-asset-as-string

let stanc: undefined | StancFunction;
let getMathSignatures: undefined | (() => string);
let getMathDistributions: undefined | (() => string);

try {
  // stanc.js code is not a module, so most nice options for loading are unavailable
  // see https://stackoverflow.com/a/54228029
  eval(rawStancJS);
  // stanc.js also detects if it is running under node, which makes testing annoying
  if (typeof module !== "undefined") {
    // node (default vitest setup)
    stanc = module.exports.stanc;
    getMathSignatures = module.exports.dump_stan_math_signatures;
    getMathDistributions = module.exports.dump_stan_math_distributions;
  } else {
    // browser
    stanc = (globalThis as any).stanc;
    getMathSignatures = (globalThis as any).dump_stan_math_signatures;
    getMathDistributions = (globalThis as any).dump_stan_math_distributions;
  }
  if (stanc && getMathSignatures && getMathDistributions) {
    const stanc_version = stanc("", "", ["version"]).result;
    console.log(`loaded stanc.js, version '${stanc_version}'`);
  } else {
    console.error("Failed to load stanc.js");
  }
} catch (e) {
  console.error("Failed to load stanc.js");
  console.error(e);
}

export { stanc, getMathSignatures, getMathDistributions };
