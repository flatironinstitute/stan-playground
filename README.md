<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./gui/public/StanPlay_Logo_RGB_White.png">
  <img alt="The Stan Playground logo" src="./gui/public/StanPlay_Logo_RGB_Full.png" align="right" width=25%>
</picture>

# stan-playground

Run Stan models directly in your browser.

[Visit the live site!](https://stan-playground.flatironinstitute.org)

## Overview

Stan Playground enables you to run Stan sampling directly in your browser, eliminating the need for any local Stan installation. This is well-suited for teaching and learning purposes and for users who want to experiment with Stan models without the hassle of setting up a local environment. You can edit Stan programs, provide input data, set sampling parameters, and view the results—all within your browser. You can also provide Python or R code to generate the input data (this also runs in the browser) and use Python or R code to post-process the results and generate plots. You can then share your results with others using the GitHub Gist feature.

While the Stan models execute in the browser (on your local machine), the compilation process requires a dedicated server. We provide a default public server for your convenience, but you can also set up your own compilation server either locally or remotely.

This project is based on [stan-web-demo](https://github.com/WardBrian/stan-web-demo) which shows how to use [TinyStan](https://github.com/WardBrian/tinystan) to build a WebAssembly version of a Stan model that can be executed in the browser. While stan-web-demo focuses on integrating a specific Stan model into a website—essentially "baking" the model into the web environment—stan-playground is designed for a broader purpose. It offers a flexible platform for experimenting with and exploring various Stan models. This makes it ideal for users looking to test different statistical models and hypotheses directly in their browser, without the commitment to a single model implementation.

Forum post: [Stan Playground: Stan without installing Stan](https://discourse.mc-stan.org/t/stan-playground-stan-without-installing-stan/37085)

## Preparing links to existing models or projects

In addition to the built-in sharing feature which integrates with [Github Gists](https://docs.github.com/en/get-started/writing-on-github/editing-and-sharing-content-with-gists), you can also manually prepare links which will pre-populate each portion of Stan Playground when clicked by using [URL Parameters](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/What_is_a_URL#parameters).

For more information, see [URL Parameters](./docs/url_parameters.md).


## Compilation server setup

Most users will prefer to use the public server for compilation. However, if you want to set up your own compilation server, use the following instructions.

[Compilation server setup](./docs/compilation_server_setup.md)

## For developers

The source code for the frontend is in the gui folder. See the readme there.

The source code for the dockerized server is in the docker folder.

## Notes

[How is this different from the previous stan-playground?](./docs/previous_stan_playground.md)

## License

Apache License 2.0

## Authors

- [Brian Ward](https://github.com/WardBrian)
- [Jeff Soules](https://github.com/jsoules)
- [Jeremy Magland](https://github.com/magland)

Center for Computational Mathematics, Flatiron Institute
