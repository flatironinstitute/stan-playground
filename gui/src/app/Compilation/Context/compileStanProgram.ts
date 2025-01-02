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

    onStatus("initiating job");
    const initiateJobUrl = `${stanWasmServerUrl}/job/initiate`;

    const initiation = await fetch(initiateJobUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer 1234",
      },
    });
    if (!initiation.ok) {
      setStatusAndWarn(
        `failed to initiate job: ${await messageOrStatus(initiation)}`,
      );
      return {};
    }
    const resp = await initiation.json();
    const job_id = resp.job_id;
    if (!job_id) {
      setStatusAndWarn(`failed to initiate job: ${JSON.stringify(resp)}`);
      return {};
    }

    onStatus(`job initiated: ${job_id}`);
    const uploadFileUrl = `${stanWasmServerUrl}/job/${job_id}/upload/main.stan`;
    const upload = await fetch(uploadFileUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: stanProgram,
    });
    if (!upload.ok) {
      setStatusAndWarn(
        `failed to upload file: ${await messageOrStatus(upload)}`,
      );
      return {};
    }
    onStatus("file uploaded successfully");

    onStatus("compiling...");
    const runJobUrl = `${stanWasmServerUrl}/job/${job_id}/run`;
    const runCompile = await fetch(runJobUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
    const downloadCheck = await fetch(mainJsUrl);
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
