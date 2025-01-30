import { ProjectContext } from "@SpCore/Project/ProjectContextProvider";
import { ProjectKnownFiles } from "@SpCore/Project/ProjectDataModel";
import { use, useMemo } from "react";

// This is used to create the text span used in the ScriptEditor component when the file is empty.
// It features a brief description and a clickable link to generate an example template.
const useTemplatedFillerText = (
  text: string,
  template: string,
  file: ProjectKnownFiles,
) => {
  const { update } = use(ProjectContext);

  const contentOnEmpty = useMemo(() => {
    const spanElement = document.createElement("span");
    const t1 = document.createTextNode(text);
    const a1 = document.createElement("a");
    a1.onclick = () => {
      update({
        type: "editFile",
        filename: file,
        content: template,
      });
    };
    a1.textContent = "Click here to generate an example";
    spanElement.appendChild(t1);
    spanElement.appendChild(a1);
    return spanElement;
  }, [file, template, text, update]);

  return contentOnEmpty;
};

export default useTemplatedFillerText;
