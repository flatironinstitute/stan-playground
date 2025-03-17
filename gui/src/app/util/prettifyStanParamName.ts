// The parameter names as-output is not super user-friendly,
// so this converts it to the syntax you'd use to access in Stan
const prettifyStanParamName = (stanParamName: string): string => {
  if (!stanParamName.includes(":") && !stanParamName.includes(".")) {
    return stanParamName;
  }
  // : means a tuple piece, . means a rectangular container index
  const parts = stanParamName.split(":").map((part) => {
    if (!part.includes(".")) {
      return part;
    }

    const pos = part.indexOf(".");
    if (pos <= 0) {
      return part;
    }
    // within any given tuple chunk, replace the first . with an opening
    // bracket, the rest with commas
    return (
      part.substring(0, pos) +
      "[" +
      part.substring(pos + 1).replace(/\./g, ",") +
      "]"
    );
  });

  // tuple indexing in the Stan language uses .
  return parts.join(".");
};

export default prettifyStanParamName;
