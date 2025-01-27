import { Delete } from "@mui/icons-material";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import { AlternatingTableRow } from "@SpComponents/StyledTables";
import {
  FileNames,
  FileRegistry,
  mapFileContentsToModel,
} from "@SpCore/FileMapping";
import { ProjectContext } from "@SpCore/ProjectContextProvider";
import { deserializeZipToFiles, parseFile } from "@SpCore/ProjectSerialization";
import UploadFilesArea from "@SpPages/UploadFilesArea";
import { FunctionComponent, useCallback, use, useState } from "react";

type File = { name: string; content: ArrayBuffer };

type LoadProjectWindowProps = {
  onClose: () => void;
};

const LoadProjectWindow: FunctionComponent<LoadProjectWindowProps> = ({
  onClose,
}) => {
  const { update } = use(ProjectContext);
  const [errorText, setErrorText] = useState<string>("");
  const [filesUploaded, setFilesUploaded] = useState<File[]>([]);

  const importUploadedZip = useCallback(
    async (zipFile: ArrayBuffer) => {
      try {
        const fileManifest = await deserializeZipToFiles(zipFile);
        update({
          type: "loadFiles",
          files: fileManifest,
          clearExisting: true,
        });
        onClose();
      } catch (e: any) {
        setErrorText(e.message);
      }
    },
    [onClose, update],
  );

  const importUploadedFiles = useCallback(
    async (o: { replaceProject: boolean }) => {
      const { replaceProject } = o;
      if (!filesUploaded) return;
      try {
        let stanFileName = "";
        const files: Partial<FileRegistry> = {};

        for (const file of filesUploaded) {
          if (file.name.endsWith(".stan")) {
            if (stanFileName !== "") {
              throw new Error("Only one .stan file can be uploaded at a time");
            }
            files["main.stan"] = parseFile(file.content);
            stanFileName = file.name;
            continue;
          }
          if (file.name.endsWith(".zip")) {
            throw new Error(
              ".zip files cannot be uploaded alongside other files",
            );
          }

          if (!Object.values(FileNames).includes(file.name as any)) {
            throw new Error(`Unsupported file name: ${file.name}`);
          }
          files[file.name as FileNames] = parseFile(file.content);
        }

        const fileManifest = mapFileContentsToModel(files);
        update({
          type: "loadFiles",
          files: fileManifest,
          clearExisting: replaceProject,
        });

        if (
          replaceProject &&
          stanFileName !== "" &&
          fileManifest.meta === undefined
        ) {
          update({ type: "retitle", title: stanFileName });
        }

        onClose();
      } catch (e: any) {
        setErrorText(e.message);
      }
    },
    [filesUploaded, onClose, update],
  );

  const onUpload = useCallback(
    (fs: File[]) => {
      if (fs.length === 1 && fs[0].name.endsWith(".zip")) {
        importUploadedZip(fs[0].content);
      } else {
        setFilesUploaded((prev) => {
          const newNames = fs.map((f) => f.name);
          const oldToKeep = prev.filter((f) => !newNames.includes(f.name));
          return [...oldToKeep, ...fs];
        });
      }
    },
    [importUploadedZip],
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
              Other individual project files (data.json, meta.json, data.py,
              etc.)
            </li>
          </ul>
        </div>
        <UploadFilesArea height={300} onUpload={onUpload} />
        {errorText !== "" && (
          <Typography color="error.main">{errorText}</Typography>
        )}

        {filesUploaded.length > 0 && (
          <>
            <TableContainer>
              <Table padding="none">
                <TableBody>
                  {filesUploaded.map(({ name, content }) => (
                    <AlternatingTableRow hover key={name}>
                      <TableCell>
                        <strong>{name}</strong>
                      </TableCell>
                      <TableCell>{content.byteLength} bytes</TableCell>
                      <TableCell>
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
                      </TableCell>
                    </AlternatingTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Grid container justifyContent="center" spacing={1}>
              <Grid item>
                <Button
                  onClick={() => importUploadedFiles({ replaceProject: true })}
                >
                  Load into a NEW project
                </Button>
              </Grid>
              <Grid item>
                <Button
                  onClick={() => importUploadedFiles({ replaceProject: false })}
                >
                  Load into EXISTING project
                </Button>
              </Grid>
            </Grid>
          </>
        )}
      </Stack>
    </div>
  );
};

export default LoadProjectWindow;
