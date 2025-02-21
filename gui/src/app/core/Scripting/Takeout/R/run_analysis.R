draws <- fit$draws(format="draws_array")

grDevices::pdf(onefile=FALSE)
source("analysis.R", local=TRUE, print.eval=TRUE)
