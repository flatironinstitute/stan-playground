def rename_sampling_options(k):
    """
    convert between names used in
    Stan-Playground and CmdStanPy
    """

    if k == "init_radius":
        return "inits"
    if k == "num_warmup":
        return "iter_warmup"
    if k == "num_samples":
        return "iter_sampling"
    if k == "num_chains":
        return "chains"
    if k == "seed":
        return "seed"

    raise ValueError(f"Unknown sampling option: {k}")


if os.path.isfile(os.path.join(HERE, "sampling_opts.json")):
    print("loading sampling_opts.json")
    with open(os.path.join(HERE, "sampling_opts.json")) as f:
        s = json.load(f)
    sampling_opts = {rename_sampling_options(k): v for k, v in s.items()}
else:
    sampling_opts = {}
