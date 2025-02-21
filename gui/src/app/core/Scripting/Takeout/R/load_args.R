.option_names_map = c(
    init_radius="init",
    num_warmup="iter_warmup",
    num_samples="iter_sampling",
    num_chains="chains"
)

sampling_opts <- list()

if (file.exists("./sampling_opts.json")) {
    opts <- jsonlite::fromJSON("./sampling_opts.json")
    for (key in names(opts)) {
        out_key <- key
        if (key %in% names(.option_names_map)) {
            out_key <- .option_names_map[[key]]
        }
        sampling_opts[[out_key]] <- opts[[key]]
    }
}
