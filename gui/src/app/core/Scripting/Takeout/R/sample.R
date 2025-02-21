print("compiling model")
model = cmdstanr::cmdstan_model("./main.stan")

print("sampling")
fit = do.call(model$sample, as.list(c(data=data, sampling_opts)))

print(fit$summary())
