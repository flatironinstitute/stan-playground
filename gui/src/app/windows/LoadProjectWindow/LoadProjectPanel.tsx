import { FunctionComponent, useCallback, use, useState } from "react";
import { useNavigate } from "react-router";

import { Delete } from "@mui/icons-material";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import FormHelperText from "@mui/material/FormHelperText";

import { AlternatingTableRow } from "@SpComponents/StyledTables";
import {
  FileNames,
  FileRegistry,
  mapFileContentsToModel,
} from "@SpCore/Project/FileMapping";
import { ProjectContext } from "@SpCore/Project/ProjectContextProvider";
import {
  deserializeZipToFiles,
  parseFile,
} from "@SpCore/Project/ProjectSerialization";
import doesGistExist from "@SpUtil/gists/doesGistExist";

import UploadFiles from "./UploadFiles";
import {
  fromQueryParams,
  QueryParamKeys,
  queryStringHasParameters,
} from "@SpCore/Project/ProjectQueryLoading";

type File = { name: string; content: ArrayBuffer };

type LoadProjectProps = {
  onClose: () => void;
};

const LoadProjectPanel: FunctionComponent<LoadProjectProps> = ({ onClose }) => {
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

  const { urlToLoad, setUrlToLoad, tryLoad } = useUrlLoader(setErrorText);

  return (
    <div className="dialogWrapper">
      <Stack spacing={2}>
        <FormControl margin="normal">
          <TextField
            variant="standard"
            label="Project URL"
            value={urlToLoad}
            onChange={(e) => setUrlToLoad(e.target.value.trim())}
            onBlur={() => {
              if (tryLoad()) {
                onClose();
              }
            }}
            onKeyUp={(e) => {
              if (e.key === "Enter" && tryLoad()) {
                onClose();
              }
            }}
          ></TextField>
          <FormHelperText component="div">
            You can supply a URL to load a project from:
            <ul style={{ margin: 0 }}>
              <li>A Stan-Playground URL</li>
              <li>A GitHub Gist URL</li>
            </ul>
          </FormHelperText>
          <UploadFiles height={300} onUpload={onUpload} />
          <FormHelperText component="div">
            You can upload:
            <ul style={{ margin: 0 }}>
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
          </FormHelperText>
        </FormControl>

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
              <Grid>
                <Button
                  onClick={() => importUploadedFiles({ replaceProject: true })}
                >
                  Load into a NEW project
                </Button>
              </Grid>
              <Grid>
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

const useUrlLoader = (setErrorText: (text: string) => void) => {
  const [urlToLoad, setURLRaw] = useState("");
  const [query, setQuery] = useState("");

  const setUrlToLoad = useCallback(
    (url: string) => {
      setURLRaw(url);
      setQuery("");

      if (url === "") return;
      if (url.startsWith("https://stan-playground.flatironinstitute.org/")) {
        const queriesOnly = new URLSearchParams(url.split("?", 2)[1]);
        if (queryStringHasParameters(fromQueryParams(queriesOnly))) {
          setQuery(`?${queriesOnly.toString()}`);
          setErrorText("");
        } else {
          setErrorText(
            "Stan-Playground URL does not contain any relevant data: " +
              url +
              " (should contain at least one of " +
              Object.values(QueryParamKeys).join(", ") +
              ")",
          );
        }
      } else if (url.startsWith("https://gist.github.com/")) {
        doesGistExist(url).then((exists) => {
          if (exists) {
            setQuery(`?project=${url}`);
            setErrorText("");
          } else {
            setErrorText("Gist not found: " + url);
          }
        });
      } else {
        setErrorText(
          "Unsupported URL: " +
            url +
            " (must be a Stan-Playground URL or a GitHub Gist URL)",
        );
      }
    },
    [setErrorText],
  );

  const navigate = useNavigate();

  const tryLoad = useCallback(() => {
    if (query === "") return false;
    navigate(query, { replace: true });
    setURLRaw("");
    return true;
  }, [navigate, query]);

  return { urlToLoad, setUrlToLoad, tryLoad };
};

export default LoadProjectPanel;
