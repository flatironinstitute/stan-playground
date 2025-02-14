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
if (!require("posterior")) {
    install.packages("posterior")
}
if (!require("cmdstanr")) {
    install.packages("cmdstanr", repos = c('https://stan-dev.r-universe.dev', getOption("repos")))
}
if (!require("jsonlite")) {
    install.packages("jsonlite")
}

library(cmdstanr)
library(jsonlite)
args <- commandArgs(trailingOnly = TRUE)
if ("--ignore-saved-data" %in% args) {
    source("data.R", local=TRUE, print.eval=TRUE)
    if (typeof(data) != "list") {
        stop("[stan-playground] data must be a list")
    }
    data <- list(data)
} else {
    print("Loading data from data.json, pass --ignore-saved-data to run data.R instead")
    data <- "./data.json"
}

.option_names_map = c(
    init_radius="init",
    num_warmup="iter_warmup",
    num_samples="iter_sampling",
    num_chains="chains"
)

sampling_opts <- list()

if (file.exists("./sampling_opts.json")) {
    opts <- jsonlite::fromJSON("./sampling_opts.json")
    for (key in names(opts)) {
        out_key <- key
        if (key %in% names(.option_names_map)) {
            out_key <- .option_names_map[[key]]
        }
        sampling_opts[[out_key]] <- opts[[key]]
    }
}

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
      lines.slice(0, 15).join("\n") +
      '\ndata <- ""\n\n' +
      lines.slice(26).join("\n");
    expect(runR).toEqual(dataless);
  });

  test("Export without analysis", () => {
    const noAnalysis = { ...testDataModel, analysisRFileContent: "" };
    const runR = makeRRuntimeScript(noAnalysis);

    // we expect the same output, truncated after the sampling part
    const analysisless = full.split("\n").slice(0, 63).join("\n") + "\n";

    expect(runR).toEqual(analysisless);
  });
});
