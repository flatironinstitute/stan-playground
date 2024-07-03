export type PyodideWorkerMode = "data.py" | "analysis.py";

export type MessageToPyodideWorker =
  | {
      type: "setPyodideWorkerMode";
      mode: PyodideWorkerMode;
    }
  | {
      type: "run";
      code: string;
    };

export const isMessageToPyodideWorker = (
  x: any,
): x is MessageToPyodideWorker => {
  if (!x) return false;
  if (typeof x !== "object") return false;
  if (x.type === "setPyodideWorkerMode")
    return ["data.py", "analysis.py"].includes(x.mode);
  if (x.type === "run") return x.code !== undefined;
  return false;
};

export type MessageFromPyodideWorker =
  | {
      type: "stdout" | "stderr";
      data: string;
    }
  | {
      type: "setStatus";
      status: PydodideWorkerStatus;
    }
  | {
      type: "setData"; // for data.py mode
      data: any;
    }
  | {
      type: "addImage"; // for analysis.py mode
      image: any;
    };

export const isMessageFromPyodideWorker = (
  x: any,
): x is MessageFromPyodideWorker => {
  if (!x) return false;
  if (typeof x !== "object") return false;
  if (x.type === "stdout") return x.data !== undefined;
  if (x.type === "stderr") return x.data !== undefined;
  if (x.type === "setStatus") return isPydodideWorkerStatus(x.status);
  if (x.type === "setData") return x.data !== undefined;
  if (x.type === "addImage") return x.image !== undefined;
  return false;
};

export type PydodideWorkerStatus =
  | "idle"
  | "loading"
  | "running"
  | "completed"
  | "failed";

export const isPydodideWorkerStatus = (x: any): x is PydodideWorkerStatus => {
  return ["idle", "loading", "running", "completed", "failed"].includes(x);
};
