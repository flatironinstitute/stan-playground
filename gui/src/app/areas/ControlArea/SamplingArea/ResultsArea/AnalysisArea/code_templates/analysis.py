import matplotlib.pyplot as plt

# Print the draws object
print(draws)

# Print parameter names
print(draws.parameter_names)

# plot the lp parameter
samples = draws.get("lp__")
print(samples.shape)
plt.hist(samples.ravel(), bins=30)
plt.title("lp__")
plt.show()

# you can also read data.json
import json

with open("data.json") as f:
    data = json.load(f)
print(data)
