source("data.R")
if (typeof(data) != "list") {
    stop("[stan-playground] data must be a list")
}
