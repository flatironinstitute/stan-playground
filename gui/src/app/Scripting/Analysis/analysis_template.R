library(posterior)
print(summary(draws))

install.packages("bayesplot")
library(bayesplot)

mcmc_hist(draws, pars = c("lp__"))

# can also access data.json
data <- jsonlite::read_json("./data.json")
data
