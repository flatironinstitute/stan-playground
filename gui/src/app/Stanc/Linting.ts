import { StancErrors } from "./Types";

type Position = {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
};

// An interface for passing markers (squiggles) to the editor without depending on monaco types
export type CodeMarker = Position & {
  message: string;
  severity: "error" | "warning" | "hint" | "info";
};

export const stancErrorsToCodeMarkers = (stancErrors: StancErrors) => {
  const codeMarkers = [
    ...(stancErrors.errors || []).map((error) =>
      stancMessageToMarker(error, "error"),
    ),
    ...(stancErrors.warnings || []).map((warning) =>
      stancMessageToMarker(warning, "warning"),
    ),
  ];

  return codeMarkers.filter((marker) => marker !== undefined);
};

const stancMessageToMarker = (
  message: string,
  severity: "error" | "warning",
): CodeMarker | undefined => {
  const position = locationFromMessage(message);
  if (position === undefined) return undefined;
  const { startLineNumber, startColumn, endLineNumber, endColumn } = position;

  return {
    startLineNumber,
    startColumn,
    endLineNumber,
    endColumn,
    message:
      severity === "warning"
        ? getWarningMessage(message)
        : getErrorMessage(message),
    severity,
  };
};

// Adapted from https://github.com/WardBrian/vscode-stan-extension

const locationFromMessage = (message: string): Position | undefined => {
  if (!message) return undefined;
  // format is "in 'filename', line (#), column (#) to (line #,)? column (#)"
  const start = message.matchAll(/'.*', line (\d+), column (\d+)( to)?/g);
  // there will be multiple in the case of #included files
  const lastMatch = Array.from(start).pop();
  if (!lastMatch) {
    return undefined;
  }

  const startLineNumber = parseInt(lastMatch[1]);
  const startColumn = parseInt(lastMatch[2]) + 1;

  let endLineNumber = startLineNumber;
  let endColumn = startColumn;

  if (lastMatch[3]) {
    // " to" was matched
    const end = message.match(/to (line (\d+), )?column (\d+)/);
    if (end) {
      if (end[1]) {
        endLineNumber = parseInt(end[2]);
      }
      endColumn = parseInt(end[3]) + 1;
    }
  }

  return { startLineNumber, startColumn, endLineNumber, endColumn };
};

const getWarningMessage = (message: string) => {
  let warning = message.replace(/Warning.*column \d+:/s, "");
  warning = warning.replace(/\s+/gs, " ");
  warning = warning.trim();
  return warning;
};

const getErrorMessage = (message: string) => {
  let error = message;
  // cut off code snippet for display
  if (message.includes("------\n")) {
    error = error.split("------\n")[2];
  }
  error = error.trim();
  return error;
};

export const exportedForTesting = {
  locationFromMessage,
  getErrorMessage,
  getWarningMessage,
};
