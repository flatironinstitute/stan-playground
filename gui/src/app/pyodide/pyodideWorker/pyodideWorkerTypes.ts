export type PyodideRunSettings = {
  loadsDraws: boolean;
  showsPlots: boolean;
  producesData: boolean;
};

export type MessageToPyodideWorker = {
  type: "run";
  code: string;
  spData: Record<string, any> | undefined;
  spRunSettings: PyodideRunSettings;
};

export const isMessageToPyodideWorker = (
  x: any,
): x is MessageToPyodideWorker => {
  if (!x) return false;
  if (typeof x !== "object") return false;
  if (x.type === "run") {
    if (x.code === undefined) return false;
    if (x.spData === undefined) return false;
    if (x.spRunSettings === undefined) return false;
    return true;
  }
  return false;
};

export type MessageFromPyodideWorker =
  | {
      type: "stdout" | "stderr";
      data: string;
    }
  | {
      type: "setStatus";
      status: PyodideWorkerStatus;
    }
  | {
      type: "setData";
      data: any;
    }
  | {
      type: "addImage";
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

export type PyodideWorkerStatus =
  | "idle"
  | "loading"
  | "installing"
  | "running"
  | "completed"
  | "failed";

export const isPydodideWorkerStatus = (x: any): x is PyodideWorkerStatus => {
  return [
    "idle",
    "loading",
    "installing",
    "running",
    "completed",
    "failed",
  ].includes(x);
};
