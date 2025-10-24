---
title: "stan-playground: Run Stan models directly in your browser."
tags:
  - WebAssembly
  - Stan
  - bayesian modeling
  - education
authors:
  - name: Brian Ward
    orcid: 0000-0002-9841-3342
    corresponding: true
    equal-contrib: true
    affiliation: 1
  - name: Jeff Soules
    orcid: 0000-0002-2240-1038
    equal-contrib: true
    affiliation: 1
  - name: Jeremy Magland
    orcid: 0000-0002-5286-4375
    equal-contrib: true
    affiliation: 1
affiliations:
  - name: Center for Computational Mathematics, Flatiron Institute
    index: 1
    ror: 00sekdz59
date: 10 October 2025
bibliography: paper.bib
---

# Summary

[Stan Playground](https://stan-playground.flatironinstitute.org/) is an in-browser editor
and execution environment for Stan [@Carpenter2017; @Stan2025] statistical models.
Models and analyses run entirely locally with no installation required, utilizing a bespoke
compilation server which translates users' models into WebAssembly modules built with the
Emscripten [@emscripten2011] toolchain. Built-in sharing features and integration with
Pyodide [@pyodide2021] and webR [@Stagg2023] make Stan Playground a complete environment
for instruction, prototyping, and analysis.

# Statement of need

Stan is a language for statistical modeling commonly used for Bayesian data analysis in
many fields. Using Stan consists of two steps: model _compilation_, where the users' Stan code is
transpiled to C++ and compiled by a C++ toolchain, and _sampling_, where the resulting model is
executed to perform statistical inference.

Because the models are themselves user-provided, model compilation requires end users to have a
working C++17 development environment installed in order to use Stan.
This requirement can be difficult to satisfy for users from less technical backgrounds or with
IT-imposed constraints on their systems. Installation-related questions are
ubiquitous on the Stan forums. This can be a particular pain point in learning environments,
where instructors do not
want to spend a substantial fraction of their teaching time ensuring students have a working
environment and copy of the relevant data and models.

Thanks to its browser-based design requiring no installation, Stan Playground allows users
to immediately focus on the issues of modeling and analysis that matter to them.
A user simply navigates to [https://stan-playground.flatironinstitute.org/](https://stan-playground.flatironinstitute.org/)
to get a blank project, or a student clicks on a link provided by their instructor with
code and data already populated. They can then begin editing, compiling, and running Stan models
immediately, regardless of their local system configuration.

A similar level of convenience could be achieved by performing both compilation and sampling on
centrally provided server, but there are several issues with this approach.
Sampling involves executing user-written code that could perform potentially-unbounded amounts of
compute. Offering this as a public server would require authentication or rate-limiting.
Additionally, even in a restricted language like Stan, one would have to take serious precautions before
allowing untrusted user code to run unchecked.

By contrast, providing a public server that only performs compilation is secure and practical.
Compilation times are similar for most models and compilation results can be cached, meaning
e.g. students in a classroom setting would only end up compiling the provided example once collectively.
Furthermore, compilation never executes any user-controlled code, obviating most security concerns.

With Stan Playground, getting started with Stan can be reduced from a lengthy, sometimes quite
technical, process into loading a web page in any modern browser.

# Key features

<!-- screenshot -->

![Stan Playground's UI after running the Lotka-Volterra example\label{fig:screenshot}](screenshot.png)


- data generation
- model editing (with diagnostics etc), compilation, sampling
- downstream analysis
- sharing features
- user compilation server


# Examples

Stan Playground provides several example programs on the left
sidebar of the home page at various levels of complexity, spanning from a basic
linear regression on fake data to
[a reimplementation of the model and analysis](https://stan-playground.flatironinstitute.org/?project=https://gist.github.com/WardBrian/d8ab811b137085f154b6145d3c36cbc4)
from @Carpenter2018.

# Implementation details

Stan Playground consists of two components. The first is a server that can compile Stan
models to WebAssembly, implemented in Python and leveraging the existing Emscripten toolchain [@emscripten2011].

The remainder of the project is the user-facing web application, which can be found at
[https://stan-playground.flatironinstitute.org/](https://stan-playground.flatironinstitute.org/).

This web application is built on the [React](https://react.dev/) framework and features various
panels to allow editing of Stan models, compilation, sampling, and downstream analysis of the
results. The use of WebAssembly and web workers allows these computations to complete quickly
and without freezing the user interface.


# Acknowledgements

Andrew Gelman and Jonah Gabry (both: Columbia University)
offered valuable early feedback on this project.

This project relies on `tinystan` [@tinystan2025], which was itself
inspired by Edward Roauldes' `BridgeStan` project [@Roualdes2023].

# References
