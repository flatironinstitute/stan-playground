import { PrintCallback, StanVariableInputs } from "./types";

// Stan expects a JSON object ("{ ... }") at the top level.
// If the input is already a string, e.g. it came from a textarea,
// we just return it as is.
export const prepareStanJSON = (obj: string | StanVariableInputs): string => {
  if (typeof obj === "string") {
    return obj;
  } else {
    return JSON.stringify(obj);
  }
};

// A printCallback that "soaks up" all the printed text.
export const printCallbackSponge = (): {
  printCallback: PrintCallback;
  getStdout: () => string;
  clearStdout: () => void;
} => {
  const stdoutHolder = { text: "" };
  const printCallback = (...args: unknown[]) => {
    const text = args.join(" ");
    stdoutHolder.text = stdoutHolder.text + text + "\n";
  };

  const getStdout = () => stdoutHolder.text;
  const clearStdout = () => (stdoutHolder.text = "");

  return { printCallback, getStdout, clearStdout };
};
