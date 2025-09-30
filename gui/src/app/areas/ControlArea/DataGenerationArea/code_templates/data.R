data <- list(a = c(1, 2, 3))

# You can also use brms formulas to generate the data.json *and* main.stan, e.g.
# library(brms)
# brm(count ~ zAge + zBase * Trt + (1|patient), data = epilepsy, family = poisson())
