import {
  initialDataModel,
  ProjectDataModel,
  ProjectKnownFiles,
} from "@SpCore/Project/ProjectDataModel";
import makeRRuntimeScript from "@SpCore/Scripting/Takeout/makeRRuntime";
import { describe, expect, test } from "vitest";

const testDataModel: ProjectDataModel = structuredClone(initialDataModel);
Object.values(ProjectKnownFiles).forEach((f) => {
  testDataModel[f] = JSON.stringify(f);
});
testDataModel.meta.title = "my title";

const full = `TITLE <- "my title"
options(repos = c('https://cloud.r-project.org/'))
install.packages("posterior")
install.packages("cmdstanr", repos = c('https://stan-dev.r-universe.dev', getOption("repos")))

library(cmdstanr)
library(jsonlite)
args <- commandArgs(trailingOnly = TRUE)
if ("--ignore-saved-data" %in% args) {
    source("data.R", local=TRUE, print.eval=TRUE)
    if (typeof(data) != "list") {
        stop("[stan-playground] data must be a list")
    }
} else {
    print("Loading data from data.json, pass --ignore-saved-data to run data.R instead")
    data <- "./data.json"
}

# TODO: sampling arguments
sampling_opts = c()

tryCatch({
    cmdstanr::cmdstan_path()
}, error = function(e) {
    if ("--install-cmdstan" %in% args) {
        cmdstanr::install_cmdstan()
    } else {
        stop("cmdstan not found, use --install-cmdstan to install")
    }
})

print("compiling model")
model = cmdstanr::cmdstan_model("./main.stan")

print("sampling")
fit = do.call(model$sample, as.list(c(data=data, sampling_opts)))

print(fit$summary())

draws <- fit$draws(format="draws_array")

grDevices::pdf(onefile=FALSE)
source("analysis.R", local=TRUE, print.eval=TRUE)
`;

describe("R runtime", () => {
  // these serve as "golden" tests, just to make sure the output is as expected

  test("Export full", () => {
    const runR = makeRRuntimeScript(testDataModel);
    console.log(runR);
    expect(runR).toEqual(full);
  });

  test("Export without data", () => {
    const noData = {
      ...testDataModel,
      dataFileContent: "",
      dataRFileContent: "",
    };
    const runR = makeRRuntimeScript(noData);

    // we expect the same output minus the data loading part
    const lines = full.split("\n");
    const dataless =
      lines.slice(0, 8).join("\n") +
      '\ndata <- ""\n' +
      lines.slice(17).join("\n");
    expect(runR).toEqual(dataless);
  });

  test("Export without analysis", () => {
    const noAnalysis = { ...testDataModel, analysisRFileContent: "" };
    const runR = makeRRuntimeScript(noAnalysis);

    // we expect the same output, truncated after the sampling part
    const analysisless = full.split("\n").slice(0, 38).join("\n") + "\n";

    expect(runR).toEqual(analysisless);
  });
});
