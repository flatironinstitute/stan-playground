if(!exists(".SP_CODE")) {
    invisible("")
} else {
    if (typeof(.SP_CODE) != "character") {
        stop("[stan-playground] .SP_CODE must be a string")
    }
    invisible(.SP_CODE)
}
