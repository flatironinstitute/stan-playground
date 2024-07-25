import {
  FunctionComponent,
  RefObject,
  useCallback,
  useMemo,
  useState,
} from "react";
import { RString, WebR } from "webr";
import getDataGenerationToolbarItems from "./getDataGenerationToolbarItems";
import TextEditor, { ToolbarItem } from "@SpComponents/TextEditor";
import { writeConsoleOutToDiv } from "@SpPyodide/AnalysisPyFileEditor";

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

      const shelter = await new webR.Shelter();

      setStatus("running");
      const rCode =
        `
# redirect install.packages to webr's version
webr::shim_install()
\n\n
` +
        fileContent +
        "\n\n" +
        `
if (typeof(data) != "list") {
  stop("[stan-playground] data must be a list")
}
.SP_DATA <- jsonlite::toJSON(data, pretty = TRUE, auto_unbox = TRUE)
.SP_DATA
            `;

      try {
        const ret = await shelter.captureR(rCode);
        ret.output.forEach(({ type, data }) => {
          if (type === "stdout" || type === "stderr") {
            writeConsoleOutToDiv(outputDiv, data, type);
          }
        });

        const result = JSON.parse(await (ret.result as RString).toString());
        if (setData) {
          setData(result);
        }
      } finally {
        shelter.purge();
      }
      setStatus("completed");
    } catch (e: any) {
      console.error(e);
      writeConsoleOutToDiv(outputDiv, e.toString(), "stderr");
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

  const contentOnEmpty = useMemo(() => {
    const spanElement = document.createElement("span");
    const t1 = document.createTextNode(
      "Define a list called data to update the data.json. ",
    );
    const a1 = document.createElement("a");
    a1.onclick = () => {
      setEditedFileContent(dataRTemplate);
    };
    a1.textContent = "Click here to generate an example";
    spanElement.appendChild(t1);
    spanElement.appendChild(a1);
    return spanElement;
  }, [setEditedFileContent]);

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
      contentOnEmpty={contentOnEmpty}
    />
  );
};

const dataRTemplate = `data <- list(
  a = c(1, 2, 3)
)`;

export default DataRFileEditor;
