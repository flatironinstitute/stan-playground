
export const triggerDownload = (blob: Blob, name: string, onClose: () => void) => {
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `SP-${name}.zip`
    a.click()
    URL.revokeObjectURL(blobUrl)
    onClose()
}
