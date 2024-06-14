export type StancErrors = {
  errors?: string[];
  warnings?: string[];
};

type StancReturn = { result?: string } & StancErrors;

export type StancFunction = (
  name: string,
  code: string,
  args: string[],
) => StancReturn;

export type StancReplyMessage = { fatal: string } | StancReturn;

export enum StancWorkerRequests {
  FormatStanCode = "format",
  CheckSyntax = "check",
}

export type StancRequestMessage = {
  purpose: StancWorkerRequests;
  name: string;
  code: string;
};
