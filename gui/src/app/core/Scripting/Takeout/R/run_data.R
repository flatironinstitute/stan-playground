source("data.R", local=TRUE, print.eval=TRUE)
if (typeof(data) != "list") {
    stop("[stan-playground] data must be a list")
}
