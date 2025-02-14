const indent = (s: string) => {
  return s
    .trim()
    .split("\n")
    .map((x) => "    " + x)
    .join("\n");
};

export default indent;
