const baseObjectCheck = (x: any): boolean => {
  return (x ?? false) && typeof x === "object";
};

export default baseObjectCheck;
