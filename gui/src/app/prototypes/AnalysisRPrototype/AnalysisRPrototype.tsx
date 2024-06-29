import { Splitter } from "@fi-sci/splitter";
import { FunctionComponent, useEffect, useState } from "react";
import AnalysisRFileEditor from "./AnalysisRFileEditor";

type AnalysisRPrototypeProps = {
  width: number;
  height: number;
};

const exampleScript = `print('This is an R script that generates graphics.')

plot(
  mpg ~ wt,
  data = mtcars,
  col = "blue",
  xlab = "Miles/(US) gallon",
  ylab = "Weight (1000 lbs)",
  main = "Miles per Gallon and Weight of Cars",
  sub = "Source: 1974 Motor Trend US magazine."
)

# Plot again
plot(
  mpg ~ wt,
  data = mtcars,
  col = "red",
  xlab = "Miles/(US) gallon",
  ylab = "Weight (1000 lbs)",
  main = "Miles per Gallon and Weight of Cars",
  sub = "Source: 1974 Motor Trend US magazine."
)
`;

const AnalysisRPrototype: FunctionComponent<AnalysisRPrototypeProps> = ({
  width,
  height,
}) => {
  const [script, setScript] = useState<string>("");
  const [editedScript, setEditedScript] = useState<string>("");

  useEffect(() => {
    setScript(exampleScript);
    setEditedScript(exampleScript);
  }, []);

  const [outputDiv, setOutputDiv] = useState<HTMLDivElement | null>(null);

  return (
    <Splitter
      width={width}
      height={height}
      initialPosition={height / 2}
      direction="vertical"
    >
      {outputDiv ? (
        <AnalysisRFileEditor
          width={0}
          height={0}
          fileName="analysis.r"
          fileContent={script}
          onSaveContent={setScript}
          editedFileContent={editedScript}
          setEditedFileContent={setEditedScript}
          readOnly={false}
          outputDiv={outputDiv}
        />
      ) : (
        <div />
      )}
      <AnalysisROutputWindow width={0} height={0} onOutputDiv={setOutputDiv} />
    </Splitter>
  );
};

type AnalysisROutputWindowProps = {
  width: number;
  height: number;
  onOutputDiv: (div: HTMLDivElement) => void;
};

const AnalysisROutputWindow: FunctionComponent<AnalysisROutputWindowProps> = ({
  width,
  height,
  onOutputDiv,
}) => {
  return (
    <div style={{ width, height, overflow: "auto" }} ref={onOutputDiv}></div>
  );
};

export default AnalysisRPrototype;
