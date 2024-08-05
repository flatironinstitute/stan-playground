import { RefObject } from "react";

type ConsoleOutType = "stdout" | "stderr";

export const writeConsoleOutToDiv = (
  parentDiv: RefObject<HTMLDivElement>,
  x: string,
  type: ConsoleOutType,
) => {
  if (x === "") return;
  if (!parentDiv.current) return;
  const preElement = document.createElement("pre");
  preElement.textContent = x;
  const divElement = document.createElement("div");
  divElement.className = type;
  divElement.appendChild(preElement);
  parentDiv.current.appendChild(divElement);
};

export const clearOutputDivs = (...parentDiv: RefObject<HTMLDivElement>[]) => {
  for (const div of parentDiv) {
    if (div.current) div.current.innerHTML = "";
  }
};
