export type File = { name: string; content: Uint8Array };

export const encodeTextFile = (name: string, content: string): File => {
  return {
    name,
    content: new TextEncoder().encode(content + "\n"),
  };
};
