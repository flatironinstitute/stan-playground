import JSZip from "jszip";

export const serializeAsZip = async (
  folderName: string,
  files: { [key: string]: string | Uint8Array } = {},
): Promise<[Blob, string]> => {
  const zip = new JSZip();
  const folder = zip.folder(folderName);
  if (!folder) {
    throw new Error("Error creating folder in zip file");
  }

  Object.entries(files).forEach(([name, content]) => {
    if (typeof content === "string") {
      content = content.trim();
    }
    if (content.length > 0) {
      folder.file(name, content);
    }
  });
  const zipBlob = await zip.generateAsync({ type: "blob" });

  return [zipBlob, folderName];
};
