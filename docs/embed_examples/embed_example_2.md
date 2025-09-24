<script src="https://stan-playground.flatironinstitute.org/stan-playground-embed.js"></script>

This is to demonstrate how to embed stan-playground in a markdown file that can be rendered on GitHub pages.

<stan-playground-embed>
<iframe width="100%" height="700" frameborder="0"></iframe>
<script type="text/plain" class="stan-program">
data {
  int<lower=0> N;
  vector[N] x;
  vector[N] y;
}
parameters {
  real alpha;
  real beta;
  real<lower=0> sigma;
}
model {
  y ~ normal(alpha + beta * x, sigma);
}
</script>
<script type="text/plain" class="stan-data">
{
  "N": 10,
  "x": [1,2,3,4,5,6,7,8,9,10],
  "y": [
    3.5164361480858806,
    1.9422090649104387,
    3.856878064212197,
    5.8081366125433025,
    7.727339580090061,
    7.974795841003987,
    9.775364868869321,
    10.737390454859584,
    12.557258326283772,
    15.382774755732974
  ]
}
</script>
</stan-playground-embed>

If it worked, you should see an embedded Stan Playground above with a simple linear regression model and some example data.

Here's another (disease transmission) example:

<stan-playground-embed>
<iframe width="100%" height="700" frameborder="0"></iframe>
<script type="text/plain" class="stan-program">
// the "susceptible-infected-recovered" model
functions {
  vector sir(real t, vector y, real beta, real gamma, int N) {
    real S = y[1];
    real I = y[2];
    real R = y[3];

    real dS_dt = -beta * I * S / N;
    real dI_dt = beta * I * S / N - gamma * I;
    real dR_dt = gamma * I;

    return [dS_dt, dI_dt, dR_dt]';
  }
}
data {
  int<lower=1> n_days;
  vector[3] y0;
  real t0;
  array[n_days] real ts;
  int N;
  array[n_days] int cases; // how many people are sick on day n
}
parameters {
  real<lower=0> gamma;
  real<lower=0> beta;
  real<lower=0> phi_inv;
}
transformed parameters {
  real phi = 1. / phi_inv;
  array[n_days] vector[3] y = ode_rk45(sir, y0, t0, ts, beta, gamma, N);
}
model {
  //priors
  beta ~ normal(2, 1);
  gamma ~ normal(0.4, 0.5);
  phi_inv ~ exponential(5);

  cases ~ poisson(y[ : , 2]);
  // try it: a overdispersed likelihood instead
  // cases ~ neg_binomial_2(y[,2], phi);
}
generated quantities {
  // R0 is the expected number of new infections caused by a single infected individual
  real R0 = beta / gamma;
  real recovery_time = 1 / gamma;
  array[n_days] real pred_cases = poisson_rng(y[ : , 2]);
  // array[n_days] real pred_cases = neg_binomial_2_rng(y[,2], phi);
}
</script>
<script type="text/plain" class="stan-data">
{
  "_source": "This data comes from the R package 'outbreaks'",
  "_description": "Influenza in a boarding school in England, 1978",
  "N": 763,
  "cases": [
    3,
    8,
    26,
    76,
    225,
    298,
    258,
    233,
    189,
    128,
    68,
    29,
    14,
    4
  ],
  "n_days": 14,
  "ts": [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14
  ],
  "t0": 0,
  "y0": [
    762,
    1,
    0
  ]
}
</script>
</stan-playground-embed>
