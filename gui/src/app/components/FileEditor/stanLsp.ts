import type * as Monaco from "monaco-editor";
import {
  type ConfigurationParams,
  LSPAny,
} from "vscode-languageserver/browser";
import { unverifiedRequest } from "@hediet/json-rpc";

// https://vitejs.dev/guide/assets#importing-script-as-a-worker
// https://vitejs.dev/guide/assets#importing-asset-as-url
import stanLspWorkerURL from "./stanLspWorker?worker&url";

// The following is a workaround for https://github.com/microsoft/monaco-editor/issues/5305
// inspired by https://github.com/microsoft/monaco-editor/pull/5156#issuecomment-3744990436
var settings = { warnPedantic: false };
var notifyServerSettingsChanged: undefined | ((params: LSPAny) => void) =
  undefined;

const workspaceConfiguration = unverifiedRequest<ConfigurationParams, LSPAny[]>(
  {
    method: "workspace/configuration",
  },
);

class ConfigurationFeature {
  constructor(c: any) {
    c.capabilities.addStaticClientCapabilities({
      workspace: {
        configuration: true,
        didChangeConfiguration: { dynamicRegistration: true },
      },
    });

    c.connection.registerRequestHandler(
      workspaceConfiguration,
      async ({ items }: ConfigurationParams) => {
        const result = [];
        for (const item of items) {
          if (item.section === "stan-language-server") {
            result.push(settings);
          } else {
            result.push(null);
          }
        }
        return { ok: result };
      },
    );
    notifyServerSettingsChanged = c.server.workspaceDidChangeConfiguration;
  }
  dispose() {}
}

export const setWarnPedantic = (value: boolean) => {
  settings.warnPedantic = value;
  notifyServerSettingsChanged && notifyServerSettingsChanged(settings);
};

export const setupStanLsp = (monacoInstance: typeof Monaco) => {
  class StanLspClient extends monacoInstance.lsp.MonacoLspClient {
    createFeatures() {
      const store = super.createFeatures();
      // @ts-ignore
      store.add(new ConfigurationFeature(this._connection));
      return store;
    }
  }
  // end workaround

  const worker = new Worker(stanLspWorkerURL, {
    name: "StanLSP",
    type: "module",
  });
  const transport = monacoInstance.lsp.createTransportToWorker(worker); //.log();

  new StanLspClient(transport);
};
