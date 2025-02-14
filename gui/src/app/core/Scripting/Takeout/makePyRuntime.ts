import { ProjectDataModel } from "@SpCore/Project/ProjectDataModel";
import indent from "@SpUtil/indent";

import spPreamble from "./py/preamble.py?raw";
import spRunData from "./py/run_data.py?raw";
import spLoadConfig from "./py/load_args.py?raw";
import spCmdStan from "./py/cmdstan.py?raw";
import spRunSampling from "./py/sample.py?raw";
import spDrawsScript from "../pyodide/sp_load_draws.py?raw";
import spRunAnalysis from "./py/run_analysis.py?raw";

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
    script += `    print("Loading data from data.json, pass --ignore-saved-data to run data.py instead")\n`;
    script += `    data = os.path.join(HERE, 'data.json')\n\n`;
  } else if (hasDataJson) {
    script += `data = os.path.join(HERE, 'data.json')\n\n`;
  } else if (hasDataPy) {
    script += spRunData;
    script += `\n`;
  } else {
    script += `data = ""\n`;
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
