
export type StanieMetaData = {
    title?: string
}

export type Stanie = {
    stan: string
    data: { [key: string]: any }
    meta: StanieMetaData
}

const examplesStanies: Stanie[] = []

const linearRegressionStan = `
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
    `.trim()
const linearRegressionData = {
    N: 5,
    x: [1, 2, 3, 4, 5],
    y: [1, 2, 3, 4, 5]
}
const linearRegressionMeta = {
    title: 'Linear regression'
}
examplesStanies.push({
    stan: linearRegressionStan,
    data: linearRegressionData,
    meta: linearRegressionMeta
})


export default examplesStanies;