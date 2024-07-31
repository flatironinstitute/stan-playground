export const checkMainJsUrlCache = async (
  stanProgram: string,
  baseStanWasmServerUrl: string,
): Promise<string | null> => {
  const mainJsCache = localStorage.getItem("mainJsCache");
  if (!mainJsCache) return null;
  try {
    const cache = JSON.parse(mainJsCache);
    const stanProgramHash = stringChecksum(stanProgram);
    const url = cache[stanProgramHash];
    if (!url) return null;
    if (!url.startsWith(baseStanWasmServerUrl)) {
      // the url is not from the current server
      return null;
    }
    // check to see if the url is still valid
    const exists = await checkRemoteFileExists(url);
    if (!exists) {
      console.warn("mainJsCache url no longer exists");
      delete cache[stanProgramHash];
      localStorage.setItem("mainJsCache", JSON.stringify(cache));
      return null;
    }
    return url;
  } catch (e) {
    console.error("Problem parsing mainJsCache");
    console.error(e);
    try {
      localStorage.removeItem("mainJsCache");
    } catch (e) {
      console.error("Problem removing mainJsCache");
      console.error(e);
    }
    return null;
  }
};

export const setToMainJsUrlCache = (stanProgram: string, url: string) => {
  try {
    const mainJsCache = localStorage.getItem("mainJsCache");
    const stanProgramHash = stringChecksum(stanProgram);
    let cache = mainJsCache ? JSON.parse(mainJsCache) : {};
    cache = cleanupIfGettingTooBig(cache);
    cache[stanProgramHash] = url;
    localStorage.setItem("mainJsCache", JSON.stringify(cache));
  } catch (e) {
    console.error("Problem setting mainJsCache");
    console.error(e);
  }
};

const cleanupIfGettingTooBig = (cache: { [key: string]: string }) => {
  // for now we just clear the whole thing if it's getting too big
  if (Object.keys(cache).length > 50) {
    return {};
  }
  return cache;
};

const stringChecksum = (str: string) => {
  let hash = 0;
  if (str.length == 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

const checkRemoteFileExists = async (url: string): Promise<boolean> => {
  const response = await fetch(url, { method: "HEAD" });
  return response.ok;
};
