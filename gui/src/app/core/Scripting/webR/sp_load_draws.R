# copied from cmdstanr, definitely doesn't handle tuples, but then neither does
# posterior
.repair_variable_names <- function(names) {
    names <- sub("\\.", "[", names)
    names <- gsub("\\.", ",", names)
    names[grep("\\[", names)] <- paste0(names[grep("\\[", names)], "]")
    names
}


.to_posterior_draws_array <- function(SP_DATA_IN) {
    draws <- SP_DATA_IN$draws
    num_chains <- SP_DATA_IN$numChains

    names <- .repair_variable_names(SP_DATA_IN$paramNames)
    num_params <- length(names)

    num_draws <- length(draws)%/%num_params%/%num_chains

    dims <- c(num_draws, num_chains, num_params)
    draws <- array(draws, dim = dims, dimnames = list(NULL, NULL, names))
    # posterior likes draws x chains x params
    draws <- aperm(draws, c(1, 2, 3))

    posterior::as_draws_array(draws)
}

draws <- .to_posterior_draws_array(.SP_DATA_IN)
rm(.SP_DATA_IN)
