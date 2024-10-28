import { ProjectDataModel } from "@SpCore/ProjectDataModel";

import spPreamble from "./preamble.py?raw";
import spRunData from "./run_data.py?raw";
import spLoadConfig from "./load_args.py?raw";
import spCmdStan from "./cmdstan.py?raw";
import spRunSampling from "./sample.py?raw";
import spDrawsScript from "../pyodide/sp_load_draws.py?raw";
import spRunAnalysis from "./run_analysis.py?raw";

const indent = (s: string) => {
  return s
    .trim()
    .split("\n")
    .map((x) => "    " + x)
    .join("\n");
};

const makePyRuntimeScript = (project: ProjectDataModel) => {
  const hasDataJson = project.dataFileContent.length > 0;
  const hasDataPy = project.dataPyFileContent.length > 0;
  const hasAnalysisPy = project.analysisPyFileContent.length > 0;

  let script = `TITLE=${JSON.stringify(project.meta.title)}\n` + spPreamble;

  // arguments
  script += `argparser.add_argument("--install-cmdstan", action="store_true", help="Install cmdstan if it is missing")\n`;
  if (hasDataJson && hasDataPy) {
    script += `argparser.add_argument("--ignore-saved-data", action="store_true", help="Ignore saved data.json files")\n`;
  }
  script += `args, _ = argparser.parse_known_args()\n\n`;

  // data
  if (hasDataJson && hasDataPy) {
    script += `if args.ignore_saved_data:\n`;
    script += indent(spRunData);
    script += `\nelse:\n`;
    script += `    print("Loading data from data.json, pass --ignore--saved-data to run data.py instead")\n`;
    script += `    data = os.path.join(HERE, 'data.json')\n\n`;
  } else if (hasDataJson) {
    script += `data = os.path.join(HERE, 'data.json')\n\n`;
  } else if (hasDataPy) {
    script += spRunData;
    script += `\n`;
  }

  // running sampler
  script += spLoadConfig;
  script += `\n`;
  script += spCmdStan;
  script += `\n`;
  script += spRunSampling;

  // analysis
  if (hasAnalysisPy) {
    script += `\n`;
    script += spDrawsScript;
    script += `\n`;
    script += spRunAnalysis;
  }

  return script;
};

export default makePyRuntimeScript;
