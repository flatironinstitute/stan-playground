import { checkMainJsUrlCache, setToMainJsUrlCache } from "./mainJsUrlCache";

const compileStanProgram = async (
  stanWasmServerUrl: string,
  stanProgram: string,
  onStatus: (s: string) => void,
): Promise<{ mainJsUrl?: string }> => {
  const setStatusAndWarn = (msg: string) => {
    onStatus(msg);
    console.warn(msg);
  };

  try {
    onStatus("checking cache");
    const downloadMainJsUrlFromCache = await checkMainJsUrlCache(
      stanProgram,
      stanWasmServerUrl,
    );
    if (downloadMainJsUrlFromCache) {
      onStatus("compiled");
      return { mainJsUrl: downloadMainJsUrlFromCache };
    }

    onStatus("compiling...");

    const compileURL = `${stanWasmServerUrl}/compile`;
    const runCompile = await fetch(compileURL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        Authorization: "Bearer 1234",
      },
      body: stanProgram,
    });
    if (!runCompile.ok) {
      setStatusAndWarn(
        `failed to compile: ${await messageOrStatus(runCompile)}`,
      );
      return {};
    }
    const compileResp = await runCompile.json();
    const mainJsUrl = `${stanWasmServerUrl}/download/${compileResp.model_id}/main.js`;

    setToMainJsUrlCache(stanProgram, mainJsUrl);

    // download to make sure it is there
    onStatus("Checking download of main.js");
    const downloadCheck = await fetch(mainJsUrl, { method: "HEAD" });
    if (!downloadCheck.ok) {
      setStatusAndWarn(
        `failed to download main.js: ${await messageOrStatus(downloadCheck)}`,
      );
      return {};
    }

    onStatus("compiled");
    return { mainJsUrl };
  } catch (e) {
    setStatusAndWarn(`failed to compile: ${e}`);
    return {};
  }
};

const messageOrStatus = async (response: Response) => {
  const j = await response.json();
  return j?.message ?? response.statusText;
};

export default compileStanProgram;
