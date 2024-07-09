export const tryFetch = async (url: string) => {
    console.log("Fetching content from", url);
    try {
      const req = await fetch(url);
      if (!req.ok) {
        console.error(
          "Failed to fetch from url",
          url,
          req.status,
          req.statusText,
        );
        return undefined;
      }
      return await req.text();
    } catch (err) {
      console.error("Failed to fetch from url", url, err);
      return undefined;
    }
  };
  