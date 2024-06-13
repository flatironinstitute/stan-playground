export type StancErrors = {
  errors?: string[];
  warnings?: string[];
};

type StancReturn = { result?: string } & StancErrors;

export enum Requests {
  Format = "format",
  Check = "check",
}

export enum Replies {
  Formatted = "formatted",
  Checked = "checked",
}

export type StancWorkerMessage = {
  purpose?: Replies;
  error: string;
} & StancReturn;

export type StancFunction = (
  name: string,
  code: string,
  args: string[],
) => StancReturn;

export type IncomingMessage = {
  purpose: Requests;
  name: string;
  code: string;
};
