export type File = { name: string; content: Uint8Array };

const encoder = new TextEncoder();

export const encodeTextFile = (name: string, content: string): File => {
  return {
    name,
    content: encoder.encode(content + "\n"),
  };
};

const decoder = new TextDecoder();

export const tryDecodeText = (content: Uint8Array): string | undefined => {
  try {
    return decoder.decode(content);
  } catch {
    return undefined;
  }
};

export const base64encode = (
  f: File,
): { name: string; b64contents: string } => {
  return {
    name: f.name,
    b64contents: btoa(
      f.content.reduce((data, byte) => data + String.fromCharCode(byte), ""),
    ),
  };
};

export const base64decode = (d: {
  name: string;
  b64contents: string;
}): File => {
  return {
    name: d.name,
    content: Uint8Array.from(atob(d.b64contents), (c) => c.charCodeAt(0)),
  };
};
