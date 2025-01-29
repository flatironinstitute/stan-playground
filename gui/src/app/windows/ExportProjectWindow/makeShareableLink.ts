export const makeSPShareableLinkFromGistUrl = (gistUrl: string) => {
  const protocol = window.location.protocol;
  const host = window.location.host;
  const url = `${protocol}//${host}?project=${gistUrl}`;
  return url;
};
