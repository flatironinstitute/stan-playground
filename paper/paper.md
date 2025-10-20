---
title: 'stan-playground: Run Stan models directly in your browser.'
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

Web interface for Stan [@Carpenter2017; @Stan2025]

# Statement of need

Stan is difficult to install.

<!-- # Mathematics

Single dollars ($) are required for inline mathematics e.g. $f(x) = e^{\pi/x}$

Double dollars make self-standing equations:

$$\Theta(x) = \left\{\begin{array}{l}
0\textrm{ if } x < 0\cr
1\textrm{ else}
\end{array}\right.$$

You can also use plain \LaTeX for equations
\begin{equation}\label{eq:fourier}
\hat f(\omega) = \int_{-\infty}^{\infty} f(x) e^{i\omega x} dx
\end{equation}
and refer to \autoref{eq:fourier} from text.

# Citations

Citations to entries in paper.bib should be in
[rMarkdown](http://rmarkdown.rstudio.com/authoring_bibliographies_and_citations.html)
format.

If you want to cite a software repository URL (e.g. something on GitHub without a preferred
citation) then you can do it with the example BibTeX entry below for @fidgit.

For a quick reference, the following citation commands can be used:
- `@author:2001`  ->  "Author et al. (2001)"
- `[@author:2001]` -> "(Author et al., 2001)"
- `[@author1:2001; @author2:2001]` -> "(Author1 et al., 2001; Author2 et al., 2002)"

# Figures

Figures can be included like this:
![Caption for example figure.\label{fig:example}](figure.png)
and referenced from text using \autoref{fig:example}.

Figure sizes can be customized by adding an optional second parameter:
![Caption for example figure.](figure.png){ width=20% } -->

# Acknowledgements

Andrew Gelman and Jonah Gabry (both: Columbia University)
offered valuable early feedback on this project.

This project relies on `tinystan` [@tinystan2025], which was itself
inspired by Edward Roauldes' `BridgeStan` project [@Roualdes2023].

# References
