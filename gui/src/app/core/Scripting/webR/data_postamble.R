# 'data' is a built in function, so we need to make sure the user actually set it
if (typeof(data) != "list") {
    stop("[stan-playground] data must be a list")
}
.SP_DATA <- jsonlite::toJSON(data, pretty = TRUE, auto_unbox = TRUE, digits = 18)
# invisible prevents printing of the output
invisible(.SP_DATA)
