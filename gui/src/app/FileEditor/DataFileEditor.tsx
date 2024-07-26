import TextEditor, { ToolbarItem } from "@SpComponents/TextEditor";
import { FunctionComponent, useMemo } from "react";

type Props = {
  fileName: string;
  fileContent: string;
  onSaveContent: () => void;
  editedFileContent: string;
  setEditedFileContent: (text: string) => void;
  onDeleteFile?: () => void;
  readOnly: boolean;
};

const DataFileEditor: FunctionComponent<Props> = ({
  fileName,
  fileContent,
  onSaveContent,
  editedFileContent,
  setEditedFileContent,
  readOnly,
}) => {
  const toolbarItems: ToolbarItem[] = useMemo(() => {
    const ret: ToolbarItem[] = [];
    return ret;
  }, []);

  return (
    <TextEditor
      language="json"
      label={fileName}
      text={fileContent}
      onSaveText={onSaveContent}
      editedText={editedFileContent}
      onSetEditedText={setEditedFileContent}
      readOnly={readOnly}
      toolbarItems={toolbarItems}
      contentOnEmpty={"Enter JSON data or use the data generation tab"}
    />
  );
};

export default DataFileEditor;
