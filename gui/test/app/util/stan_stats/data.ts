import stanCSV1 from "./data/stan1.csv?raw";
import stanCSV2 from "./data/stan2.csv?raw";

const parseCSV = (csv: string): number[][] => {
  let lines = csv.split("\n");
  lines = lines.filter((l) => l.trim() && !l.trimStart().startsWith("#"));
  lines.shift(); // remove header
  const data = lines.map((line) => {
    return line.split(",").map((value) => parseFloat(value));
  });
  // transpose
  const dataT = data[0].map((_, i) => data.map((row) => row[i]));
  return dataT;
};

export const data1 = parseCSV(stanCSV1);
export const data2 = parseCSV(stanCSV2);
