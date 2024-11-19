install.packages("optparse")
install.packages("posterior")
install.packages("cmdstanr", repos = c('https://stan-dev.r-universe.dev', getOption("repos")))

library(cmdstanr)
library(jsonlite)
library(optparse)
