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

export enum Replies {
  Formatted = "formatted",
  Checked = "checked",
}

export type StancReplyMessage = {
  purpose?: Replies;
  error: string;
} & StancReturn;

export enum Requests {
  Format = "format",
  Check = "check",
}

export type StancRequestMessage = {
  purpose: Requests;
  name: string;
  code: string;
};
