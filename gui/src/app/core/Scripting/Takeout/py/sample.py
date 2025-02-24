print("compiling model")
model = cmdstanpy.CmdStanModel(stan_file=os.path.join(HERE, "main.stan"))

print("sampling")
fit = model.sample(data=data, **sampling_opts)

print(fit.summary())
