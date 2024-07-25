import {
  FunctionComponent,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PlayArrow } from "@mui/icons-material";
import { PyodideWorkerStatus } from "./pyodideWorker/pyodideWorkerTypes";
import { GlobalDataForAnalysisPy } from "../pages/HomePage/AnalysisPyWindow/AnalysisPyWindow";
import usePyodideWorker from "./pyodideWorker/usePyodideWorker";
import TextEditor, { ToolbarItem } from "@SpComponents/TextEditor";

type Props = {
  fileName: string;
  fileContent: string;
  onSaveContent: () => void;
  editedFileContent: string;
  setEditedFileContent: (text: string) => void;
  readOnly: boolean;
  imagesRef: RefObject<HTMLDivElement>;
  consoleRef: RefObject<HTMLDivElement>;
  spData: GlobalDataForAnalysisPy | undefined;
  scriptHeader?: string;
};

const AnalysisPyFileEditor: FunctionComponent<Props> = ({
  fileName,
  fileContent,
  onSaveContent,
  editedFileContent,
  setEditedFileContent,
  readOnly,
  imagesRef,
  consoleRef,
  spData,
}) => {
  const [status, setStatus] = useState<PyodideWorkerStatus>("idle");

  const callbacks = useMemo(
    () => ({
      onStdout: (x: string) => writeConsoleOutToDiv(consoleRef, x, "stdout"),
      onStderr: (x: string) => writeConsoleOutToDiv(consoleRef, x, "stderr"),
      onImage: (b64: string) => {
        const imageUrl = `data:image/png;base64,${b64}`;

        const img = document.createElement("img");
        img.style.width = "100%";
        img.src = imageUrl;

        const divElement = document.createElement("div");
        divElement.appendChild(img);
        imagesRef.current?.appendChild(divElement);
      },
      onStatus: (status: PyodideWorkerStatus) => {
        setStatus(status);
      },
    }),
    [consoleRef, imagesRef],
  );

  const { run } = usePyodideWorker(callbacks);

  const hasData = useMemo(() => {
    return spData !== undefined;
  }, [spData]);

  useEffect(() => {
    setStatus("idle");
  }, [spData, fileContent]);

  const handleRun = useCallback(() => {
    if (status === "running") {
      return;
    }
    if (editedFileContent !== fileContent) {
      throw new Error("Cannot run edited code");
    }

    if (consoleRef.current) {
      consoleRef.current.innerHTML = "";
    }
    if (imagesRef.current) {
      imagesRef.current.innerHTML = "";
    }
    run(fileContent, spData, {
      loadsDraws: true,
      showsPlots: true,
      producesData: false,
    });
  }, [
    status,
    editedFileContent,
    fileContent,
    consoleRef,
    imagesRef,
    run,
    spData,
  ]);
  const toolbarItems: ToolbarItem[] = useMemo(() => {
    const ret: ToolbarItem[] = [];
    const runnable =
      fileContent === editedFileContent && imagesRef.current && hasData;
    if (runnable) {
      ret.push({
        type: "button",
        tooltip: "Run script",
        label: "Run",
        icon: <PlayArrow />,
        onClick: handleRun,
        color: "black",
      });
    }
    if (!hasData) {
      ret.push({
        type: "text",
        label: "Run sampler first",
        color: "red",
      });
    }
    if (!imagesRef.current) {
      ret.push({
        type: "text",
        label: "No output window",
        color: "red",
      });
    }
    let label: string;
    let color: string;
    if (status === "loading") {
      label = "Loading pyodide...";
      color = "blue";
    } else if (status === "running") {
      label = "Running...";
      color = "blue";
    } else if (status === "installing") {
      label = "Installing packages...";
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
  }, [fileContent, editedFileContent, imagesRef, hasData, status, handleRun]);

  const contentOnEmpty = useMemo(() => {
    const spanElement = document.createElement("span");
    const t1 = document.createTextNode(
      "Use the draws object to access the samples. ",
    );
    const a1 = document.createElement("a");
    a1.onclick = () => {
      setEditedFileContent(analysisPyTemplate);
    };
    a1.textContent = "Click here to generate an example";
    spanElement.appendChild(t1);
    spanElement.appendChild(a1);
    return spanElement;
  }, [setEditedFileContent]);

  return (
    <TextEditor
      language="python"
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

const analysisPyTemplate = `import matplotlib.pyplot as plt

# Get the parameter names
print(draws.parameter_names)

# plot the lp parameter
samples = draws.get("lp__")
print(samples.shape)
plt.hist(samples.ravel(), bins=30)
plt.title("lp__")
plt.show()
`;

type ConsoleOutType = "stdout" | "stderr";

export const writeConsoleOutToDiv = (
  parentDiv: RefObject<HTMLDivElement>,
  x: string,
  type: ConsoleOutType,
) => {
  if (x === "") return;
  if (!parentDiv.current) return;
  const styleClass = type === "stdout" ? "WorkerStdout" : "WorkerStderr";
  const preElement = document.createElement("pre");
  preElement.textContent = x;
  const divElement = document.createElement("div");
  divElement.className = styleClass;
  divElement.appendChild(preElement);
  parentDiv.current.appendChild(divElement);
};

export default AnalysisPyFileEditor;
