import { checkMainJsUrlCache, setToMainJsUrlCache } from "./mainJsUrlCache";

const compileStanProgram = async (
  stanWasmServerUrl: string,
  stanProgram: string,
  onStatus: (s: string) => void,
): Promise<{ mainJsUrl?: string }> => {
  try {
    onStatus("checking cache");
    const downloadMainJsUrlFromCache = await checkMainJsUrlCache(stanProgram);
    if (downloadMainJsUrlFromCache) {
      onStatus("compiled");
      return { mainJsUrl: downloadMainJsUrlFromCache };
    }

    onStatus("initiating job");
    const initiateJobUrl = `${stanWasmServerUrl}/job/initiate`;
    // post
    const a = await fetch(initiateJobUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer 1234",
      },
    });
    if (!a.ok) {
      onStatus(`failed to initiate job: ${a.statusText}`);
      return {};
    }
    const resp = await a.json();
    const job_id = resp.job_id;
    if (!job_id) {
      onStatus(`failed to initiate job: ${JSON.stringify(resp)}`);
      return {};
    }

    onStatus(`job initiated: ${job_id}`);
    const uploadFileUrl = `${stanWasmServerUrl}/job/${job_id}/upload/main.stan`;
    const b = await fetch(uploadFileUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: stanProgram,
    });
    if (!b.ok) {
      onStatus(`failed to upload file: ${b.statusText}`);
      return {};
    }
    onStatus("file uploaded successfully");

    onStatus("compiling...");
    const runJobUrl = `${stanWasmServerUrl}/job/${job_id}/run`;
    const c = await fetch(runJobUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!c.ok) {
      const j = await c.json();
      onStatus(`failed to run job: ${j?.message ?? c.statusText}`);
      return {};
    }

    const downloadMainJsUrl = `${stanWasmServerUrl}/job/${job_id}/download/main.js`;

    setToMainJsUrlCache(stanProgram, downloadMainJsUrl);

    // download to make sure it is there
    onStatus("Checking download of main.js");
    const d = await fetch(downloadMainJsUrl);
    if (!d.ok) {
      onStatus(`failed to download main.js: ${d.statusText}`);
      return {};
    }

    onStatus("compiled");
    return { mainJsUrl: downloadMainJsUrl };
  } catch (e) {
    onStatus(`failed to compile: ${e}`);
    return {};
  }
};

export default compileStanProgram;
