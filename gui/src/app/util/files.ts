export type File = { name: string; content: Uint8Array };

const encoder = new TextEncoder();
export const encodeTextFile = (name: string, content: string): File => {
  return {
    name,
    content: encoder.encode(content + "\n"),
  };
};

const decoder = new TextDecoder();
export const tryDecodeText = (
  content: AllowSharedBufferSource,
): string | undefined => {
  try {
    return decoder.decode(content);
  } catch {
    return undefined;
  }
};

export type base64EncodedFile = { name: string; b64contents: string };

// TODO: use Uint8Array.toBase64 and Uint8Array.fromBase64 when it has been available for longer

export const base64encode = ({ name, content }: File): base64EncodedFile => {
  return {
    name,
    b64contents: btoa(
      content.reduce((data, byte) => data + String.fromCharCode(byte), ""),
    ),
  };
};

export const base64decode = ({
  name,
  b64contents,
}: base64EncodedFile): File => {
  return {
    name,
    content: Uint8Array.from(atob(b64contents), (c) => c.charCodeAt(0)),
  };
};
