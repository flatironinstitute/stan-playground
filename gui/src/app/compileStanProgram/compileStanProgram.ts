const compileStanProgram = async (stanWasmServerUrl: string, stanProgram: string, onStatus: (s: string) => void): Promise<{mainJsUrl: string | undefined}> => {
    try {
        onStatus("initiating job");
        const initiateJobUrl = `${stanWasmServerUrl}/job/initiate`
        // post
        const a = await fetch(initiateJobUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer 1234"
            }
        });
        if (!a.ok) {
            onStatus(`failed to initiate job: ${a.statusText}`);
            return {mainJsUrl: undefined}
        }
        const resp = await a.json();
        const job_id = resp.job_id;
        if (!job_id) {
            onStatus(`failed to initiate job: ${JSON.stringify(resp)}`);
            return {mainJsUrl: undefined}
        }

        onStatus(`job initiated: ${job_id}`);
        const uploadFileUrl = `${stanWasmServerUrl}/job/${job_id}/upload/main.stan`;
        const b = await fetch(uploadFileUrl, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain",
            },
            body: stanProgram
        });
        if (!b.ok) {
            onStatus(`failed to upload file: ${b.statusText}`);
            return {mainJsUrl: undefined}
        }
        onStatus("file uploaded successfully");

        onStatus("compiling...");
        const runJobUrl = `${stanWasmServerUrl}/job/${job_id}/run`;
        const c = await fetch(runJobUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            }
        });
        if (!c.ok) {
            onStatus(`failed to run job: ${c.statusText}`);
            return {mainJsUrl: undefined}
        }
        const respC = await c.json();
        if (respC.status !== 'completed') {
            onStatus(`job failed: ${JSON.stringify(respC)}`);
            return {mainJsUrl: undefined}
        }

        const downloadMainJsUrl = `${stanWasmServerUrl}/job/${job_id}/download/main.js`;
        // const downloadMainWasmUrl = `${stanWasmServerUrl}/job/${job_id}/download/main.wasm`;

        // download to make sure it is there
        onStatus("downloading main.js");
        const d = await fetch(downloadMainJsUrl);
        if (!d.ok) {
            onStatus(`failed to download main.js: ${d.statusText}`);
            return {mainJsUrl: undefined}
        }
        // const mainJs = await d.text();

        // skip checking for the wasm because it is too big
        // onStatus("downloading main.wasm");
        // const e = await fetch(downloadMainWasmUrl);
        // if (!e.ok) {
        //     onStatus(`failed to download main.wasm: ${e.statusText}`);
        //     return {mainJsUrl: undefined}
        // }
        // const mainWasm = await e.arrayBuffer();

        // console.info('=========================================== main.js ===========================================');
        // console.info(mainJs);
        // console.info('=========================================== main.wasm ===========================================');
        // console.info(mainWasm);
        // setStatusMessage("Created main.js and main.wasm files. See the browser console for more details.");

        onStatus("compiled");
        return {mainJsUrl: downloadMainJsUrl}
    }
    catch (e) {
        onStatus(`failed to compile: ${e}`);
        return {mainJsUrl: undefined}
    }
}

export default compileStanProgram