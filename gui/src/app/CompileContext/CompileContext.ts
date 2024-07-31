import { createContext } from "react";

export type CompileStatus =
  | "preparing"
  | "compiling"
  | "compiled"
  | "failed"
  | "";

type CompileContextType = {
  compileStatus: CompileStatus;
  compileMessage: string;
  compiledMainJsUrl?: string;
  validSyntax: boolean;
  compile: () => void;
  setValidSyntax: (valid: boolean) => void;
};

export const CompileContext = createContext<CompileContextType>({
  compileStatus: "",
  compileMessage: "",
  validSyntax: false,
  compile: () => {},
  setValidSyntax: () => {},
});
