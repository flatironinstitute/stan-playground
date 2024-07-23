import { ToolbarItem } from "@SpComponents/TextEditor";
import { PyodideWorkerStatus } from "@SpPyodide/pyodideWorker/pyodideWorkerTypes";
import { Help, PlayArrow } from "@mui/icons-material";

const getDataGenerationToolbarItems = (o: {
  status: PyodideWorkerStatus;
  runnable: boolean;
  onRun: () => void;
  onHelp: () => void;
}): ToolbarItem[] => {
  const { status, onRun, runnable, onHelp } = o;
  const ret: ToolbarItem[] = [];
  ret.push({
    type: "button",
    tooltip: "Help",
    icon: <Help />,
    onClick: onHelp,
  });
  if (runnable) {
    ret.push({
      type: "button",
      tooltip: "Run code to generate data",
      label: "Run",
      icon: <PlayArrow />,
      onClick: onRun,
      color: "black",
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
};

export default getDataGenerationToolbarItems;
