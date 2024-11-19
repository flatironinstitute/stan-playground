_option_names_map = {
    "init_radius": "inits",
    "num_warmup": "iter_warmup",
    "num_samples": "iter_sampling",
    "num_chains": "chains",
}

if os.path.isfile(os.path.join(HERE, "sampling_opts.json")):
    print("loading sampling_opts.json")
    with open(os.path.join(HERE, "sampling_opts.json")) as f:
        s = json.load(f)
    sampling_opts = {_option_names_map.get(k, k): v for k, v in s.items()}
else:
    sampling_opts = {}
