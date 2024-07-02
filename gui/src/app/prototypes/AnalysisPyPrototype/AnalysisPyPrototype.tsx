import { Splitter } from "@fi-sci/splitter";
import { FunctionComponent, useEffect, useState } from "react";
import AnalysisPyFileEditor from "./AnalysisPyFileEditor";
import AnalysisPyFileEditorNoWorker from "./AnalysisPyFileEditorNoWorker";

type AnalysisPyPrototypeProps = {
  width: number;
  height: number;
  useWorker?: boolean;
};

const exampleScript = `import sys
import numpy as np
import matplotlib.pyplot as plt

x = np.linspace(0, 2 * np.pi, 100)
y = np.sin(x)

print('Plotting a sine wave')
plt.figure()
plt.plot(x, y, label='Sine Wave')
plt.title('Sine Wave Example')
plt.xlabel('Angle (radians)')
plt.ylabel('Amplitude')
plt.legend()
plt.show()

print("This is a test error message", file=sys.stderr)

print('Plotting a cosine wave')
y2 = np.cos(x)
plt.figure()
plt.plot(x, y2, 'r--', label='Cosine Wave')
plt.title('Cosine Wave Example')
plt.xlabel('Angle (radians)')
plt.ylabel('Amplitude')
plt.legend()
plt.show()

# Raise an exception intentionally
raise Exception('test exception')
`;

const AnalysisPyPrototype: FunctionComponent<AnalysisPyPrototypeProps> = ({
  width,
  height,
  useWorker = true
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
      {useWorker ? (
        <AnalysisPyFileEditor
          key="analsyis-py-file-editor-worker"
          width={0}
          height={0}
          fileName="analysis.py"
          fileContent={script}
          onSaveContent={() => setScript(editedScript)}
          editedFileContent={editedScript}
          setEditedFileContent={setEditedScript}
          readOnly={false}
          outputDiv={outputDiv}
        />
      ) : (
        <AnalysisPyFileEditorNoWorker
          key="analsyis-py-file-editor-no-worker"
          width={0}
          height={0}
          fileName="analysis.py"
          fileContent={script}
          onSaveContent={() => setScript(editedScript)}
          editedFileContent={editedScript}
          setEditedFileContent={setEditedScript}
          readOnly={false}
          outputDiv={outputDiv}
        />
      )}
      <AnalysisPyOutputWindow key={`analysis-py-output-window-${useWorker}`} width={0} height={0} onOutputDiv={setOutputDiv} />
    </Splitter>
  );
};

type AnalysisPyOutputWindowProps = {
  width: number;
  height: number;
  onOutputDiv: (div: HTMLDivElement) => void;
};

const AnalysisPyOutputWindow: FunctionComponent<
  AnalysisPyOutputWindowProps
> = ({ width, height, onOutputDiv }) => {
  return (
    <div style={{ width, height, overflow: "auto" }} ref={onOutputDiv}></div>
  );
};

export default AnalysisPyPrototype;
