try:
    cmdstanpy.cmdstan_path()
except Exception:
    if args.install_cmdstan:
        cmdstanpy.install_cmdstan()
    else:
        raise ValueError("cmdstan not found, use --install-cmdstan to install")
