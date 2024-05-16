export const storeBlob = async (kind: string, blob: string) => {
    const stanWasmServerUrl = localStorage.getItem('stanWasmServerUrl') || 'https://trom-stan-wasm-server.magland.org'
    const url = `${stanWasmServerUrl}/blob/${kind}`
    // post
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: blob }),
    })
    if (!response.ok) {
        throw new Error(`Failed to store blob: ${response.statusText}`)
    }
    const data = await response.json()
    return data.sha1
}

export const fetchBlob = async (kind: string, sha1: string) => {
    const stanWasmServerUrl = localStorage.getItem('stanWasmServerUrl') || 'https://trom-stan-wasm-server.magland.org'
    const url = `${stanWasmServerUrl}/blob/${kind}/${sha1}`
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Failed to fetch blob: ${response.statusText}`)
    }
    return await response.text()
}