import {
  FunctionComponent,
  RefObject,
  useCallback,
  useMemo,
  useState,
} from "react";
import { WebR } from "webr";
import getDataGenerationToolbarItems from "./getDataGenerationToolbarItems";
import TextEditor, { ToolbarItem } from "@SpComponents/TextEditor";

type Props = {
  fileName: string;
  fileContent: string;
  onSaveContent: () => void;
  editedFileContent: string;
  setEditedFileContent: (text: string) => void;
  readOnly: boolean;
  setData?: (data: any) => void;
  outputDiv: RefObject<HTMLDivElement>;
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
    if (outputDiv.current) {
      outputDiv.current.innerHTML = "";
    }
    setStatus("loading");
    try {
      const webR = await loadWebRInstance();

      setStatus("running");
      const rCode =
        `
# redirect install.packages to webr's version
webr::shim_install()

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
if (typeof(data) != "list") {
  stop("[stan-playground] data must be a list")
}
result <- list(data = data, print_log = print_log)
json_result <- jsonlite::toJSON(result, pretty = TRUE, auto_unbox = TRUE)
json_result
            `;
      const resultJson = await webR.evalRString(rCode);
      const result = JSON.parse(resultJson);

      if (setData && result.data) {
        setData(result.data);
      }
      if (outputDiv.current && result.print_log) {
        result.print_log.forEach((x: string) => {
          const divElement = document.createElement("div");
          divElement.style.color = "blue";
          const preElement = document.createElement("pre");
          divElement.appendChild(preElement);
          preElement.textContent = x;
          outputDiv.current?.appendChild(divElement);
        });
      }
      setStatus("completed");
    } catch (e: any) {
      console.error(e);
      if (outputDiv.current) {
        const divElement = document.createElement("div");
        divElement.style.color = "red";
        const preElement = document.createElement("pre");
        divElement.appendChild(preElement);
        preElement.textContent = e.toString();
        outputDiv.current.appendChild(divElement);
      }
      setStatus("failed");
    }
  }, [editedFileContent, fileContent, status, setData, outputDiv]);

  const handleHelp = useCallback(() => {
    alert(
      'Write an R script to assign data to the "data" variable and then click "Run" to generate data.',
    );
  }, []);

  const toolbarItems: ToolbarItem[] = useMemo(
    () =>
      getDataGenerationToolbarItems({
        name: "WebR",
        status,
        runnable: fileContent === editedFileContent,
        onRun: handleRun,
        onHelp: handleHelp,
      }),
    [fileContent, editedFileContent, handleRun, status, handleHelp],
  );

  return (
    <TextEditor
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
