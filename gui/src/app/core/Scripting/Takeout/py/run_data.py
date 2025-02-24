print("executing data.py")
with open(os.path.join(HERE, "data.py")) as f:
    exec(f.read())
if "data" not in locals():
    raise ValueError("data variable not defined in data.py")
