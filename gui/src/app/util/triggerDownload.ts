export const triggerDownload = (
  blob: Blob,
  filename: string,
  onClose: () => void,
) => {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(blobUrl);
  onClose();
};
