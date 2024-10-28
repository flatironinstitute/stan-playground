import matplotlib.pyplot as plt

print("executing analysis.py")

sp_data = {
    "draws": fit.draws(concat_chains=True),
    "paramNames": fit.metadata.cmdstan_config["raw_header"].split(","),
    "numChains": fit.chains,
}

draws = sp_load_draws(sp_data)
del sp_data

with open(os.path.join(HERE, "analysis.py")) as f:
    exec(f.read())

if len(plt.gcf().get_children()) > 1:
    plt.show()
