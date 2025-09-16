const doesGistExist = async (gistUri: string): Promise<boolean> => {
  try {
    const r = await fetch(
      "https://stan-playground-gist-access.vercel.app/api/gist/exists",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gistUri }),
      },
    );
    if (!r.ok) {
      return false;
    }
    const result = await r.json();
    return result.exists === true;
  } catch (e) {
    return false;
  }
};

export default doesGistExist;
