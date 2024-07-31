import {
  FieldsContentsMap,
  FileNames,
  FileRegistry,
  mapFileContentsToModel,
} from "@SpCore/FileMapping";
import { ProjectContext } from "@SpCore/ProjectContextProvider";
import { deserializeZipToFiles, parseFile } from "@SpCore/ProjectSerialization";
import UploadFilesArea from "@SpPages/UploadFilesArea";
import { SmallIconButton } from "@fi-sci/misc";
import { Delete } from "@mui/icons-material";
import Link from "@mui/material/Link";
import Button from "@mui/material/Button";
import {
  FunctionComponent,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import BrowserProjectsInterface, {
  BrowserProject,
} from "./BrowserProjectsInterface";
import timeAgoString from "@SpUtil/timeAgoString";

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

  const [allBrowserProjects, setAllBrowserProjects] = useState<
    BrowserProject[]
  >([]);
  useEffect(() => {
    const bpi = new BrowserProjectsInterface();
    bpi.getAllBrowserProjects().then((p) => {
      setAllBrowserProjects(p);
    });
  }, []);

  const handleOpenBrowserProject = useCallback(
    async (title: string) => {
      const bpi = new BrowserProjectsInterface();
      const browserProject = await bpi.loadBrowserProject(title);
      if (!browserProject) {
        alert("Failed to load project");
        return;
      }
      const { fileManifest } = browserProject;
      update({
        type: "loadFiles",
        files: mapFileContentsToModel(fileManifest),
        clearExisting: true,
      });
      onClose();
    },
    [update, onClose],
  );

  return (
    <div>
      <h3>Upload project</h3>
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
      <div className="ErrorText">{errorText}</div>
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
          <Button onClick={() => importUploadedFiles({ replaceProject: true })}>
            Load into a NEW project
          </Button>
          &nbsp;
          <Button
            onClick={() => importUploadedFiles({ replaceProject: false })}
          >
            Load into EXISTING project
          </Button>
        </div>
      )}
      <h3>Load from browser</h3>
      {allBrowserProjects.length > 0 ? (
        <table>
          <tbody>
            {allBrowserProjects.map((browserProject) => (
              <tr key={browserProject.title}>
                <td>
                  <SmallIconButton
                    icon={<Delete />}
                    onClick={async () => {
                      const ok = window.confirm(
                        `Delete project "${browserProject.title}" from browser?`,
                      );
                      if (!ok) return;
                      const bpi = new BrowserProjectsInterface();
                      await bpi.deleteProject(browserProject.title);
                      const p = await bpi.getAllBrowserProjects();
                      setAllBrowserProjects(p);
                    }}
                  />
                </td>
                <td>
                  <Link
                    onClick={() => {
                      handleOpenBrowserProject(browserProject.title);
                    }}
                    component="button"
                    underline="none"
                  >
                    {browserProject.title}
                  </Link>
                </td>
                <td>
                  <span style={{ color: "gray" }}>
                    {timeAgoString(browserProject.timestamp)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>No projects found in browser storage</div>
      )}
    </div>
  );
};

export default LoadProjectWindow;
