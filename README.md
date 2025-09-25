<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./gui/public/StanPlay_Logo_RGB_White.png">
  <img alt="The Stan Playground logo" src="./gui/public/StanPlay_Logo_RGB_Full.png" align="right" width=25%>
</picture>

# stan-playground

Run Stan models directly in your browser.

[Visit the live site!](https://stan-playground.flatironinstitute.org)

## Overview

Stan Playground is a browser-based editor and runtime environment for Stan models. Users can edit, compile, and run models, as well as analyze the results using built-in plots and statistics or custom analysis code in Python or R, all with no local installation required. This is well-suited for teaching and learning purposes and for users who want to experiment with Stan models without the hassle of setting up a local environment. You can also share your results with others using the GitHub Gist feature.

While the Stan models execute in the browser (on your local machine), the compilation process requires a dedicated server. We provide a default public server for your convenience, but you can also set up your own compilation server either locally or remotely.

Announcement post: [Stan Playground: Stan without installing Stan](https://discourse.mc-stan.org/t/stan-playground-stan-without-installing-stan/37085)

## Documentation

The features of Stan Playground are documented on [Github Pages](https://flatironinstitute.github.io/stan-playground).
See there for information on customizing the website, preparing easy-to-share links, embedding it in your own page, and
more.

## Code organization

The compilation server is a FastAPI project with a dockerized environment
located in the `backend/` folder.

The website frontend is a Vitejs/React project located in the `gui/` folder.
The [README](./gui/README.md) there gives information on how to get started running a local development server.

This project is based on [stan-web-demo](https://github.com/WardBrian/stan-web-demo) which shows how to use [TinyStan](https://github.com/WardBrian/tinystan) to build a WebAssembly version of a Stan model that can be executed in the browser. While stan-web-demo focuses on integrating a specific Stan model into a website—essentially "baking" the model into the web environment—stan-playground is designed for a broader purpose. It offers a flexible platform for experimenting with and exploring various Stan models. This makes it ideal for users looking to test different statistical models and hypotheses directly in their browser, without the commitment to a single model implementation.

## License

Apache License 2.0

## Authors

- [Brian Ward](https://github.com/WardBrian)
- [Jeff Soules](https://github.com/jsoules)
- [Jeremy Magland](https://github.com/magland)

Center for Computational Mathematics, Flatiron Institute
