import baseObjectCheck from "@SpUtil/baseObjectCheck";

// monaco-editor has a call to globalThis.postMessage with the '*' target
// so our workers will recieve this message. We ignore it to prevent
// anything weird from happening.
export const isMonacoWorkerNoise = (obj: any): boolean =>
  !baseObjectCheck(obj) ||
  Object.prototype.hasOwnProperty.call(obj, "vscodeScheduleAsyncWork");
