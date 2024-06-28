export const computeMean = (x: number[]) => {
  if (x.length === 0) {
    return NaN;
  }
  let sum = 0;
  for (const xi of x) {
    sum += xi;
  }
  return sum / x.length;
};

export const computeStdDev = (x: number[]) => {
  if (x.length < 2) {
    return NaN;
  }
  const mean = computeMean(x);
  let sumsqr = 0;
  for (const xi of x) {
    sumsqr += (xi - mean) * (xi - mean);
  }
  return Math.sqrt(sumsqr / (x.length - 1));
};

export const computePercentile = (xSorted: number[], p: number) => {
  if (xSorted.length === 0) {
    return NaN;
  }
  const isSorted = xSorted.every((xi, i) => i === 0 || xi >= xSorted[i - 1]);
  if (!isSorted) {
    throw new RangeError("Array is not sorted");
  }
  const i = Math.floor(p * xSorted.length);
  return xSorted[i];
};
