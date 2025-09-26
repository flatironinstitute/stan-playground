import { StancReturn } from "stanc3";

export type StancErrors = Omit<StancReturn, "result">;

export type StancReplyMessage = { fatal: string } | StancReturn;

export enum StancWorkerRequests {
  FormatStanCode = "format",
  CheckSyntax = "check",
}

export type StancRequestMessage = {
  purpose: StancWorkerRequests;
  name: string;
  code: string;
  pedantic: boolean;
};
