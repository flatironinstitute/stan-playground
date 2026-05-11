import startLanguageServer from "stan-language-server";
import {
  createConnection,
  BrowserMessageReader,
  BrowserMessageWriter,
} from "vscode-languageserver/browser";

const messageReader = new BrowserMessageReader(
  self as DedicatedWorkerGlobalScope,
);
const messageWriter = new BrowserMessageWriter(
  self as DedicatedWorkerGlobalScope,
);
const connection = createConnection(messageReader, messageWriter);

startLanguageServer(connection);
