tryCatch({
    cmdstanr::cmdstan_path()
}, error = function(e) {
    if ("--install-cmdstan" %in% args) {
        cmdstanr::install_cmdstan()
    } else {
        stop("cmdstan not found, use --install-cmdstan to install")
    }
})
