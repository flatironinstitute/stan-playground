import { FunctionComponent, useCallback, useMemo, useState } from "react";
import TextEditor, { ToolbarItem } from "../../FileEditor/TextEditor";
import { PlayArrow } from "@mui/icons-material";
import { WebR } from "webr";

type Props = {
  fileName: string;
  fileContent: string;
  onSaveContent: (text: string) => void;
  editedFileContent: string;
  setEditedFileContent: (text: string) => void;
  readOnly: boolean;
  setData?: (data: any) => void;
  width: number;
  height: number;
};

let webR: WebR | null = null;
const loadWebRInstance = async () => {
  if (webR === null) {
    const w = new WebR();
    await w.init();
    w.installPackages(["jsonlite"]);
    webR = w;
    return webR;
  } else {
    return webR;
  }
};

const DataRFileEditor: FunctionComponent<Props> = ({
  fileName,
  fileContent,
  onSaveContent,
  editedFileContent,
  setEditedFileContent,
  setData,
  readOnly,
  width,
  height,
}) => {
  const [status, setStatus] = useState<
    "idle" | "loading" | "running" | "completed" | "failed"
  >("idle");
  const handleRun = useCallback(async () => {
    if (status === "running") {
      return;
    }
    if (editedFileContent !== fileContent) {
      throw new Error("Cannot run edited code");
    }
    setStatus("loading");
    try {
      const webR = await loadWebRInstance();
      setStatus("running");
      const rCode =
        fileContent +
        "\n\n" +
        `
# Convert the list to JSON format
json_data <- jsonlite::toJSON(data, pretty = TRUE, auto_unbox = TRUE)
json_data
            `;
      const result = await webR.evalRString(rCode);
      if (setData) {
        setData(JSON.parse(result));
      }
      setStatus("completed");
    } catch (e) {
      console.error(e);
      setStatus("failed");
    }
  }, [editedFileContent, fileContent, status, setData]);
  const toolbarItems: ToolbarItem[] = useMemo(() => {
    const ret: ToolbarItem[] = [];
    const runnable = fileContent === editedFileContent;
    if (runnable) {
      ret.push({
        type: "button",
        tooltip: "Run code to generate data",
        label: "Run",
        icon: <PlayArrow />,
        onClick: handleRun,
        color: "black",
      });
    }
    let label: string;
    let color: string;
    if (status === "loading") {
      label = "Loading webr...";
      color = "blue";
    } else if (status === "running") {
      label = "Running...";
      color = "blue";
    } else if (status === "completed") {
      label = "Completed";
      color = "green";
    } else if (status === "failed") {
      label = "Failed";
      color = "red";
    } else {
      label = "";
      color = "black";
    }
    if (label) {
      ret.push({
        type: "text",
        label,
        color,
      });
    }
    return ret;
  }, [fileContent, editedFileContent, handleRun, status]);

  return (
    <TextEditor
      width={width}
      height={height}
      language="r"
      label={fileName}
      text={fileContent}
      onSaveText={onSaveContent}
      editedText={editedFileContent}
      onSetEditedText={setEditedFileContent}
      readOnly={readOnly}
      toolbarItems={toolbarItems}
    />
  );
};

export default DataRFileEditor;
