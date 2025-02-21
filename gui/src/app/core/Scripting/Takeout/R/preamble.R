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
