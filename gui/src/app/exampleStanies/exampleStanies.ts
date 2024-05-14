
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

// generated with beta = 1.25, alpha = -0.1, sigma = 0.1
const linearRegressionData = {
    "N": 10,
    "x": [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
    ],
    "y": [
        1.175246231294085,
        2.407986514262124,
        3.722795906507695,
        4.913215145535075,
        6.086548493077272,
        7.278023025499204,
        8.587414785721538,
        9.990151691417916,
        11.251678394115302,
        12.406899413685272
    ]
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
