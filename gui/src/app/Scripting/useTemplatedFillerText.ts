import { ProjectContext } from "@SpCore/ProjectContextProvider";
import { ProjectKnownFiles } from "@SpCore/ProjectDataModel";
import { useContext, useMemo } from "react";

const useTemplatedFillerText = (
  text: string,
  template: string,
  file: ProjectKnownFiles,
) => {
  const { update } = useContext(ProjectContext);

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
