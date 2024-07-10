import { FunctionComponent, useCallback, useMemo, useState } from "react";
import { Help, PlayArrow } from "@mui/icons-material";
import { WebR } from "webr";
import TextEditor, { ToolbarItem } from "../../../FileEditor/TextEditor";

type Props = {
  fileName: string;
  fileContent: string;
  onSaveContent: () => void;
  editedFileContent: string;
  setEditedFileContent: (text: string) => void;
  readOnly: boolean;
  setData?: (data: any) => void;
  width: number;
  height: number;
  outputDiv?: HTMLDivElement | null;
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
  outputDiv,
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
    if (outputDiv) {
      outputDiv.innerHTML = "";
    }
    setStatus("loading");
    try {
      const webR = await loadWebRInstance();

      setStatus("running");
      const rCode =
        `
# Create a list to store printed statements
print_log <- list()

# Check if original print function is already saved
if (!exists("sp_original_print")) {
  # Save the original print function
  sp_original_print <- print
}

# Override the print function
print <- function(..., sep = " ", collapse = NULL) {
  # Capture the printed output
  printed_output <- paste(..., sep = sep, collapse = collapse)

  # Append to the print log
  print_log <<- c(print_log, printed_output)

  # Call the original print function
  sp_original_print(printed_output)
}
` +
        fileContent +
        "\n\n" +
        `
result <- list(data = data, print_log = print_log)
json_result <- jsonlite::toJSON(result, pretty = TRUE, auto_unbox = TRUE)
json_result
            `;
      const resultJson = await webR.evalRString(rCode);
      console.log("--- resultJson", resultJson);
      const result = JSON.parse(resultJson);

      if (setData && result.data) {
        setData(result.data);
      }
      if (outputDiv && result.print_log) {
        result.print_log.forEach((x: string) => {
          const divElement = document.createElement("div");
          divElement.style.color = "blue";
          const preElement = document.createElement("pre");
          divElement.appendChild(preElement);
          preElement.textContent = x;
          outputDiv.appendChild(divElement);
        });
      }
      setStatus("completed");
    } catch (e: any) {
      console.error(e);
      if (outputDiv) {
        const divElement = document.createElement("div");
        divElement.style.color = "red";
        const preElement = document.createElement("pre");
        divElement.appendChild(preElement);
        preElement.textContent = e.toString();
        outputDiv.appendChild(divElement);
      }
      setStatus("failed");
    }
  }, [editedFileContent, fileContent, status, setData, outputDiv]);

  const handleHelp = useCallback(() => {
    alert(
      'Write an R script to assign data to the "data" variable and then click "Run" to generate data.',
    );
  }, []);

  const toolbarItems: ToolbarItem[] = useMemo(() => {
    const ret: ToolbarItem[] = [];
    const runnable = fileContent === editedFileContent;
    ret.push({
      type: "button",
      tooltip: "Help",
      icon: <Help />,
      onClick: handleHelp,
    });
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
