import baseObjectCheck from "@SpUtil/baseObjectCheck";

export type PyodideRunSettings = Partial<{
  loadsDraws: boolean;
  showsPlots: boolean;
  producesData: boolean;
}>;

export type MessageToPyodideWorker = {
  type: "run";
  code: string;
  spData: Record<string, any> | undefined;
  spRunSettings: PyodideRunSettings;
};

export const isMessageToPyodideWorker = (
  x: any,
): x is MessageToPyodideWorker => {
  if (!baseObjectCheck(x)) return false;
  if (x.type !== "run") return false;
  if (x.code === undefined) return false;
  if (x.spData === undefined) return false;
  if (x.spRunSettings === undefined) return false;
  return true;
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
  if (!baseObjectCheck(x)) return false;
  if (x.type === "stdout") return x.data !== undefined;
  if (x.type === "stderr") return x.data !== undefined;
  if (x.type === "setStatus") return isPyodideWorkerStatus(x.status);
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

export const isPyodideWorkerStatus = (x: any): x is PyodideWorkerStatus => {
  return [
    "idle",
    "loading",
    "installing",
    "running",
    "completed",
    "failed",
  ].includes(x);
};