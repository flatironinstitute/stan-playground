import { PrintCallback } from "./types";

export const string_safe_jsonify = (obj: string | unknown): string => {
  if (typeof obj === "string") {
    return obj;
  } else {
    return JSON.stringify(obj);
  }
};

export const soakingPrintCallback = (): {
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
