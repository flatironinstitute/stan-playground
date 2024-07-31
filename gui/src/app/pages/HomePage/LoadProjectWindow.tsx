import { Delete } from "@mui/icons-material";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import {
  FileNames,
  FileRegistry,
  mapFileContentsToModel,
} from "@SpCore/FileMapping";
import { ProjectContext } from "@SpCore/ProjectContextProvider";
import { deserializeZipToFiles, parseFile } from "@SpCore/ProjectSerialization";
import UploadFilesArea from "@SpPages/UploadFilesArea";
import { FunctionComponent, useCallback, useContext, useState } from "react";

type File = { name: string; content: ArrayBuffer };

type LoadProjectWindowProps = {
  onClose: () => void;
};

const LoadProjectWindow: FunctionComponent<LoadProjectWindowProps> = ({
  onClose,
}) => {
  const { update } = useContext(ProjectContext);
  const [errorText, setErrorText] = useState<string>("");
  const [filesUploaded, setFilesUploaded] = useState<File[]>([]);

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
        } else {
          let stanFileName = "";
          const files: Partial<FileRegistry> = {};

          for (const file of filesUploaded) {
            if (file.name.endsWith(".stan")) {
              if (stanFileName !== "") {
                throw Error("Only one .stan file can be uploaded at a time");
              }
              files["main.stan"] = parseFile(file.content);
              stanFileName = file.name;
              continue;
            }
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

          if (stanFileName !== "" && fileManifest.meta === undefined) {
            update({ type: "retitle", title: stanFileName });
          }
        }
        onClose();
      } catch (e: any) {
        setErrorText(e.message);
      }
    },
    [filesUploaded, onClose, update],
  );

  const onUpload = useCallback(
    (fs: { name: string; content: ArrayBuffer }[]) => {
      if (fs.length === 1 && fs[0].name.endsWith(".zip")) {
        setFilesUploaded(fs);
        importUploadedFiles({ replaceProject: true });
      } else {
        setFilesUploaded((prev) => {
          const newNames = fs.map((f) => f.name);
          const oldToKeep = prev.filter((f) => !newNames.includes(f.name));
          return [...oldToKeep, ...fs];
        });
      }
    },
    [importUploadedFiles],
  );

  return (
    <div className="dialogWrapper">
      <Stack spacing={2}>
        <div>
          You can upload:
          <ul>
            <li>A .zip file that was previously exported</li>
            <li>
              A directory of files that were extracted from an exported .zip
              file
            </li>
            <li>An individual *.stan file</li>
            <li>
              Other individual project files (meta.json, data.json, init.json,
              etc.)
            </li>
          </ul>
        </div>
        <UploadFilesArea height={300} onUpload={onUpload} />
        {errorText !== "" && <div className="ErrorText">{errorText}</div>}

        {filesUploaded.length > 0 && (
          <>
            <div>
              <table className="project-summary-table">
                <tbody>
                  {filesUploaded.map(({ name, content }) => (
                    <tr key={name}>
                      <td>{name}</td>
                      <td>{content.byteLength} bytes</td>
                      <td>
                        <IconButton
                          onClick={() => {
                            setFilesUploaded((prev) =>
                              prev.filter((f) => f.name !== name),
                            );
                          }}
                          size="small"
                        >
                          <Delete fontSize="inherit" />
                        </IconButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <Button
                onClick={() => importUploadedFiles({ replaceProject: true })}
              >
                Load into a NEW project
              </Button>
              <span style={{ margin: "0 10px" }}>or</span>
              <Button
                onClick={() => importUploadedFiles({ replaceProject: false })}
              >
                Load into EXISTING project
              </Button>
            </div>
          </>
        )}
      </Stack>
    </div>
  );
};

export default LoadProjectWindow;
