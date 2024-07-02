import {
  FunctionComponent,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  FieldsContentsMap,
  FileNames,
  FileRegistry,
  mapFileContentsToModel,
} from "../../Project/FileMapping";
import { ProjectContext } from "../../Project/ProjectContextProvider";
import {
  deserializeZipToFiles,
  parseFile,
} from "../../Project/ProjectSerialization";
import UploadFilesArea from "./UploadFilesArea";

type LoadProjectWindowProps = {
  onClose: () => void;
};

const LoadProjectWindow: FunctionComponent<LoadProjectWindowProps> = ({
  onClose,
}) => {
  const { update } = useContext(ProjectContext);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [filesUploaded, setFilesUploaded] = useState<
    { name: string; content: ArrayBuffer }[] | null
  >(null);
  const [showReplaceProjectOptions, setShowReplaceProjectOptions] =
    useState<boolean>(false);

  const importUploadedFiles = useCallback(
    async (o: { replaceProject: boolean }) => {
      const { replaceProject } = o;
      if (!filesUploaded) return;
      try {
        if (
          filesUploaded.length === 1 &&
          filesUploaded[0].name.endsWith(".zip")
        ) {
          // a single .zip file
          const fileManifest = await deserializeZipToFiles(
            filesUploaded[0].content,
          );
          update({
            type: "loadFiles",
            files: fileManifest,
            clearExisting: replaceProject,
          });
        } else if (
          filesUploaded.length === 1 &&
          filesUploaded[0].name.endsWith(".stan")
        ) {
          // a single .stan file
          if (replaceProject) {
            update({ type: "retitle", title: filesUploaded[0].name });
          }
          const fileManifest: Partial<FieldsContentsMap> = {
            stanFileContent: parseFile(filesUploaded[0].content),
          };
          update({
            type: "loadFiles",
            files: fileManifest,
            clearExisting: replaceProject,
          });
        } else {
          const files: Partial<FileRegistry> = {};
          for (const file of filesUploaded) {
            if (!Object.values(FileNames).includes(file.name as any)) {
              throw Error(`Unrecognized file: ${file.name}`);
            }
            files[file.name as FileNames] = parseFile(file.content);
          }

          const fileManifest = mapFileContentsToModel(files);
          update({
            type: "loadFiles",
            files: fileManifest,
            clearExisting: replaceProject,
          });
        }
        onClose();
      } catch (e: any) {
        setErrorText(e.message);
      }
    },
    [filesUploaded, onClose, update],
  );

  useEffect(() => {
    if (!filesUploaded) return;
    if (filesUploaded.length === 1 && !filesUploaded[0].name.endsWith(".zip")) {
      // The user has uploaded a single file and it is not a zip file. In
      // this case we want to give the user the option whether or not to
      // replace the current project.
      setShowReplaceProjectOptions(true);
    } else {
      // Otherwise, we just go ahead and import the files, replacing the
      // entire project
      importUploadedFiles({ replaceProject: true });
    }
  }, [filesUploaded, importUploadedFiles]);

  return (
    <div>
      <h3>Load project</h3>
      <div>
        You can upload:
        <ul>
          <li>A .zip file that was previously exported</li>
          <li>
            A directory of files that were extracted from an exported .zip file
          </li>
          <li>An individual *.stan file</li>
          <li>An individual data.json file</li>
        </ul>
      </div>
      <div style={{ color: "red" }}>{errorText}</div>
      {!filesUploaded ? (
        <div>
          <UploadFilesArea height={300} onUpload={setFilesUploaded} />
        </div>
      ) : (
        <div>
          {filesUploaded.map((file) => (
            <div key={file.name}>{file.name}</div>
          ))}
        </div>
      )}
      {showReplaceProjectOptions && (
        <div>
          <button onClick={() => importUploadedFiles({ replaceProject: true })}>
            Load into a NEW project
          </button>
          &nbsp;
          <button
            onClick={() => importUploadedFiles({ replaceProject: false })}
          >
            Load into EXISTING project
          </button>
        </div>
      )}
    </div>
  );
};

export default LoadProjectWindow;
