import numpy as np
import json

# Set random seed for reproducibility
np.random.seed(0)

# Generate sample data
N = 20  # number of data points
K = 3   # number of predictors

# True parameters
alpha_true = 2.5
beta_true = np.array([1.2, -0.8, 0.5])
sigma_true = 0.5

# Generate predictor matrix
x = np.random.normal(0, 1, (N, K))

# Generate outcomes
y = x @ beta_true + alpha_true + np.random.normal(0, sigma_true, N)

# Prepare data for Stan
data = {
    "N": N,
    "K": K,
    "x": x.tolist(),
    "y": y.tolist()
}

# Save to JSON file
with open("chapters/regression/linear_regression_multiple_predictors.json", "w") as f:
    json.dump(data, f, indent=2)
