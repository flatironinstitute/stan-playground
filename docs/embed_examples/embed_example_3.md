Here is an example of embedding Stan Playground in a markdown document using external files for the Stan program and data.

<stan-playground-embed
    stan="./linear_regression_multiple_predictors.stan"
    data="./linear_regression_multiple_predictors.json"
>
<iframe width="100%" height="600" frameborder="0"></iframe>
</stan-playground-embed>