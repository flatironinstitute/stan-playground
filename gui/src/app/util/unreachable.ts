// Helper function to check if a switch statement is exhaustive
// By using the never type, we make TSC prove that all cases are handled
export const unreachable = (_: never): never => {
  throw Error("Unreachable code reached");
};
