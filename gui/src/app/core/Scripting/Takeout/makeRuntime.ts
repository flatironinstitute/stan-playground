import { ProjectDataModel } from "@SpCore/Project/ProjectDataModel";
import indent from "@SpUtil/indent";

const makeRuntimeScript = async (
  project: ProjectDataModel,
  type: "R" | "py",
) => {
  const {
    spPreamble,
    spRunData,
    spLoadConfig,
    spCmdStan,
    spRunSampling,
    spLoadDraws,
    spRunAnalysis,
  } = await loadParts(type);

  const keyType = type === "R" ? "R" : "Py";

  const hasDataJson = project.dataFileContent.length > 0;
  const hasDataScript = project[`data${keyType}FileContent`].length > 0;
  const hasAnalysisScript = project[`analysis${keyType}FileContent`].length > 0;

  let script =
    `TITLE = ${JSON.stringify(project.meta.title)}\n` + spPreamble + "\n";

  // data
  if (hasDataJson && hasDataScript) {
    const { start, middle, end } = checkIfIgnoreData(type);
    script += start;
    script += indent(spRunData);
    script += middle;
    script += `    print("Loading data from data.json, pass --ignore-saved-data to run data.${type} instead")\n`;
    script += indent(loadDataFromFile(type));
    script += end;
  } else if (hasDataJson) {
    script += loadDataFromFile(type);
  } else if (hasDataScript) {
    script += spRunData;
    script += "\n";
  } else {
    script += `data = ""\n\n`;
  }

  // running sampler
  script += spLoadConfig;
  script += "\n";
  script += spCmdStan;
  script += "\n";
  script += spRunSampling;

  // analysis
  if (hasAnalysisScript) {
    script += "\n";
    script += spLoadDraws;
    script += "\n";
    script += spRunAnalysis;
  }

  return script;
};

const loadParts = async (type: "R" | "py") => {
  const [
    spPreamble,
    spRunData,
    spLoadConfig,
    spCmdStan,
    spRunSampling,
    spLoadDraws,
    spRunAnalysis,
  ] = await Promise.all([
    import(`./${type}/preamble.${type}?raw`).then((m) => m.default),
    import(`./${type}/run_data.${type}?raw`).then((m) => m.default),
    import(`./${type}/load_args.${type}?raw`).then((m) => m.default),
    import(`./${type}/cmdstan.${type}?raw`).then((m) => m.default),
    import(`./${type}/sample.${type}?raw`).then((m) => m.default),
    type === "py"
      ? import(`../pyodide/sp_load_draws.py?raw`).then((m) => m.default)
      : Promise.resolve("") /* R uses posterior, no custom script needed */,
    import(`./${type}/run_analysis.${type}?raw`).then((m) => m.default),
  ]);

  return {
    spPreamble,
    spRunData,
    spLoadConfig,
    spCmdStan,
    spRunSampling,
    spLoadDraws,
    spRunAnalysis,
  };
};

const loadDataFromFile = (type: "R" | "py") => {
  if (type === "R") {
    return `data <- "./data.json"\n`;
  }
  return `data = os.path.join(HERE, 'data.json')\n`;
};

const checkIfIgnoreData = (type: "R" | "py") => {
  if (type === "R") {
    const start = `if ("--ignore-saved-data" %in% args) {\n`;
    const middle = `\n} else {\n`;
    const end = `\n}\n\n`;
    return { start, middle, end };
  }
  return {
    start: `if args.ignore_saved_data:\n`,
    middle: "\nelse:\n",
    end: "\n\n",
  };
};

export default makeRuntimeScript;
