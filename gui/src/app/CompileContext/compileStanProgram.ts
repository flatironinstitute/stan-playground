import { checkMainJsUrlCache, setToMainJsUrlCache } from "./mainJsUrlCache";

const compileStanProgram = async (
  stanWasmServerUrl: string,
  stanProgram: string,
  onStatus: (s: string) => void,
): Promise<{ mainJsUrl?: string }> => {
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
      onStatus(`failed to initiate job: ${await messageOrStatus(initiation)}`);
      return {};
    }
    const resp = await initiation.json();
    const job_id = resp.job_id;
    if (!job_id) {
      onStatus(`failed to initiate job: ${JSON.stringify(resp)}`);
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
      onStatus(`failed to upload file: ${await messageOrStatus(upload)}`);
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
      onStatus(`failed to compile: ${await messageOrStatus(runCompile)}`);
      return {};
    }

    const mainJsUrl = `${stanWasmServerUrl}/job/${job_id}/download/main.js`;

    setToMainJsUrlCache(stanProgram, mainJsUrl);

    // download to make sure it is there
    onStatus("Checking download of main.js");
    const downloadCheck = await fetch(mainJsUrl);
    if (!downloadCheck.ok) {
      onStatus(
        `failed to download main.js: ${await messageOrStatus(downloadCheck)}`,
      );
      return {};
    }

    onStatus("compiled");
    return { mainJsUrl };
  } catch (e) {
    onStatus(`failed to compile: ${e}`);
    return {};
  }
};

const messageOrStatus = async (response: Response) => {
  const j = await response.json();
  return j?.message ?? response.statusText;
};

export default compileStanProgram;
