library(posterior)
print(summary(draws))

install.packages("bayesplot")
library(bayesplot)

mcmc_hist(draws, pars = c("lp__"))
