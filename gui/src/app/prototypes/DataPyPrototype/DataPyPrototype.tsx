import { Splitter } from "@fi-sci/splitter";
import { FunctionComponent, useEffect, useMemo, useState } from "react";
import DataPyFileEditor from "./DataPyFileEditor";
import TextEditor from "../../FileEditor/TextEditor";

type DataPyPrototypeProps = {
  width: number;
  height: number;
};

const exampleScript = `import numpy as np

n = 5
x = np.arange(n)
y = np.arange(n) ** 2 + np.random.random(n)
z = [1, 2, 'c']

print("Creating data")

data = {
    'x': x,
    'y': y,
    'z': z
}
`;

const DataPyPrototype: FunctionComponent<DataPyPrototypeProps> = ({
  width,
  height,
}) => {
  const [script, setScript] = useState<string>("");
  const [editedScript, setEditedScript] = useState<string>("");
  const [data, setData] = useState<any>(undefined);
  const [consoleOutputDiv, setConsoleOutputDiv] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setScript(exampleScript);
    setEditedScript(exampleScript);
  }, []);

  return (
    <Splitter
      width={width}
      height={height}
      initialPosition={height / 2}
      direction="vertical"
    >
      <DataPyFileEditor
        width={0}
        height={0}
        fileName="data.py"
        fileContent={script}
        onSaveContent={() => setScript(editedScript)}
        editedFileContent={editedScript}
        setEditedFileContent={setEditedScript}
        readOnly={false}
        setData={setData}
        outputDiv={consoleOutputDiv || undefined}
      />
      <BottomView width={0} height={0} data={data} onConsoleOutputDiv={setConsoleOutputDiv} />
    </Splitter>
  );
};

type BottomViewProps = {
  width: number;
  height: number;
  data: any;
  onConsoleOutputDiv: (div: HTMLDivElement) => void;
};

const BottomView: FunctionComponent<BottomViewProps> = ({
  width,
  height,
  data,
  onConsoleOutputDiv,
}) => {
  return (
    <Splitter
      width={width}
      height={height}
      initialPosition={width / 2}
      direction="horizontal"
    >
      <DataPyOutputWindow width={0} height={0} data={data} />
      <ConsoleOutputWindow width={0} height={0} onConsoleOutputDiv={onConsoleOutputDiv} />
    </Splitter>
  );
};

type ConsoleOutputWindowProps = {
  width: number;
  height: number;
  onConsoleOutputDiv: (div: HTMLDivElement) => void;
};

const ConsoleOutputWindow: FunctionComponent<ConsoleOutputWindowProps> = ({
  width,
  height,
  onConsoleOutputDiv,
}) => {
  return (
    <div style={{ position: 'absolute', width, height, overflow: 'auto' }} ref={onConsoleOutputDiv} />
  )
};

type DataPyOutputWindowProps = {
  width: number;
  height: number;
  data: any;
};

const DataPyOutputWindow: FunctionComponent<DataPyOutputWindowProps> = ({
  width,
  height,
  data,
}) => {
  const text = useMemo(
    () => (data ? JSON.stringify(data, null, 2) : ""),
    [data],
  );
  return (
    <div style={{ width, height, overflow: "hidden" }}>
      <TextEditor
        width={width}
        height={height}
        language="json"
        label="Data"
        text={text}
        editedText={text}
        onSaveText={() => {}} // do nothing
        onSetEditedText={() => {}}
        readOnly={true}
      />
    </div>
  );
};

export default DataPyPrototype;
