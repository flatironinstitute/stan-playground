options(repos = c('https://cloud.r-project.org/'))
install.packages("posterior")
install.packages("cmdstanr", repos = c('https://stan-dev.r-universe.dev', getOption("repos")))

library(cmdstanr)
library(jsonlite)
