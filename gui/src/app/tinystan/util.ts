export const string_safe_jsonify = (obj: string | unknown): string => {
  if (typeof obj === "string") {
    return obj;
  } else {
    return JSON.stringify(obj);
  }
};
