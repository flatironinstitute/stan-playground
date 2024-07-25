export type InterpreterStatus =
  | "idle"
  | "loading"
  | "installing"
  | "running"
  | "completed"
  | "failed";

export const isInterpreterStatus = (x: any): x is InterpreterStatus => {
  return [
    "idle",
    "loading",
    "installing",
    "running",
    "completed",
    "failed",
  ].includes(x);
};
