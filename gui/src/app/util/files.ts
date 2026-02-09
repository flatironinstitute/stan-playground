export type File = { name: string; content: Uint8Array };

export const encodeTextFile = (name: string, content: string): File => {
  return {
    name,
    content: new TextEncoder().encode(content + "\n"),
  };
};

export const base64encode = (f: File): { name: string; content: string } => {
  return {
    name: f.name,
    content: btoa(
      f.content.reduce((data, byte) => data + String.fromCharCode(byte), ""),
    ),
  };
};

export const base64decode = (d: { name: string; content: string }): File => {
  return {
    name: d.name,
    content: Uint8Array.from(atob(d.content), (c) => c.charCodeAt(0)),
  };
};
