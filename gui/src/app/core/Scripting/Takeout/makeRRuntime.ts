import { ProjectDataModel } from "@SpCore/Project/ProjectDataModel";
import indent from "@SpUtil/indent";

import spPreamble from "./R/preamble.R?raw";
import spRunData from "./R/run_data.R?raw";
import spLoadConfig from "./R/load_args.R?raw";
import spCmdStan from "./R/cmdstan.R?raw";
import spRunSampling from "./R/sample.R?raw";
import spRunAnalysis from "./R/run_analysis.R?raw";

const makeRRuntimeScript = (project: ProjectDataModel) => {
  const hasDataJson = project.dataFileContent.length > 0;
  const hasDataR = project.dataRFileContent.length > 0;
  const hasAnalysisR = project.analysisRFileContent.length > 0;

  let script = `TITLE <- ${JSON.stringify(project.meta.title)}\n` + spPreamble;

  // arguments
  script += "args <- commandArgs(trailingOnly = TRUE)\n";

  // data
  if (hasDataJson && hasDataR) {
    script += `if ("--ignore-saved-data" %in% args) {\n`;
    script += indent(spRunData);
    script += `\n} else {\n`;
    script += `    print("Loading data from data.json, pass --ignore-saved-data to run data.R instead")\n`;
    script += `    data <- "./data.json"\n`;
    script += `}\n\n`;
  } else if (hasDataJson) {
    script += `data <- "./data.json"\n\n`;
  } else if (hasDataR) {
    script += spRunData;
    script += `\n`;
  } else {
    script += `data <- ""\n\n`;
  }

  // running sampler
  script += spLoadConfig;
  script += `\n`;
  script += spCmdStan;
  script += `\n`;
  script += spRunSampling;

  // analysis
  if (hasAnalysisR) {
    script += `\n`;
    script += spRunAnalysis;
  }

  return script;
};

export default makeRRuntimeScript;
