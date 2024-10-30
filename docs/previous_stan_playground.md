# How is this different from the previous stan-playground?

The [previous version of stan-playground](https://discourse.mc-stan.org/t/old-introducing-stan-playground-a-web-based-platform-for-stan-programming-and-collaboration/31653) also provided a mechanism for running Stan models through the browser. However, that project relied on server-side processing for sampling. In contrast, this iteration of stan-playground (despite sharing the same name) performs all sampling directly within the browser, enhancing user control and privacy.

Note that while sampling and data remain local to the user's machine, the Stan code must be sent to the compilation server for compilation. The operators of the compilation server have limited access to submitted code, but users developing proprietary models should consider [running a local compilation server](./compilation_server_setup.md) or not using this tool.
