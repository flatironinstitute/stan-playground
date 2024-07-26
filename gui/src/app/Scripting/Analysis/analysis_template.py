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
