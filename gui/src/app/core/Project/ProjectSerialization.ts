import {
  FieldsContentsMap,
  FileNames,
  FileRegistry,
  ProjectFileMap,
  mapFileContentsToModel,
  mapModelToFileManifest,
} from "@SpCore/Project/FileMapping";
import {
  ProjectDataModel,
  ProjectKnownFiles,
  getStringKnownFileKeys,
  initialDataModel,
  isProjectDataModel,
  isProjectMetaData,
  parseSamplingOpts,
  persistStateToEphemera,
} from "@SpCore/Project/ProjectDataModel";
import { base64decode, base64encode, tryDecodeText } from "@SpUtil/files";
import { replaceSpacesWithUnderscores } from "@SpUtil/replaceSpaces";
import { serializeAsZip } from "@SpUtil/serializeAsZip";
import JSZip from "jszip";

import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";

export const serializeProjectToString = (data: ProjectDataModel): string => {
  const b64files = data.extraDataFiles.map(base64encode);
  const intermediary = {
    ...data,
    ephemera: undefined,
    extraDataFiles: b64files,
  };
  return JSON.stringify(intermediary);
};

export const deserializeProjectFromString = (
  serialized: string,
): ProjectDataModel | undefined => {
  try {
    const intermediary = JSON.parse(serialized);
    // Not sure if this is strictly necessary
    intermediary.ephemera = {};
    const stringFileKeys = getStringKnownFileKeys();
    stringFileKeys.forEach((k) => (intermediary.ephemera[k] = intermediary[k]));

    const extraDataFiles = (intermediary.extraDataFiles ?? []).map(
      base64decode,
    );
    intermediary.extraDataFiles = extraDataFiles;

    if (!isProjectDataModel(intermediary)) {
      console.warn(intermediary);
      throw new Error("Deserialized data is not a valid ProjectDataModel");
    }
    return intermediary;
  } catch (e) {
    console.error("Error deserializing data from string", e);
    return undefined;
  }
};

const LZ_PARAMETER_PREFIX = "lz-string:";

export const hasKnownProjectParameterPrefix = (param: string) =>
  param.startsWith(LZ_PARAMETER_PREFIX);

export const serializeProjectToURLParameter = (
  data: ProjectDataModel,
): string => {
  return (
    LZ_PARAMETER_PREFIX +
    compressToEncodedURIComponent(serializeProjectToString(data))
  );
};

export const deserializeProjectFromURLParameter = (
  param: string,
): ProjectDataModel | undefined => {
  if (!param.startsWith(LZ_PARAMETER_PREFIX)) {
    console.error("URL parameter does not have expected prefix");
    return undefined;
  }
  const encoded = param.substring(LZ_PARAMETER_PREFIX.length);
  const decompressed = decompressFromEncodedURIComponent(encoded);
  if (!decompressed) {
    console.error("Failed to decompress project data from URL parameter");
    return undefined;
  }
  return deserializeProjectFromString(decompressed);
};

export const serializeProjectToZip = async (
  data: ProjectDataModel,
  runPy: string | null,
  runR: string | null,
): Promise<[Blob, string]> => {
  const fileManifest: { [key: string]: string | Uint8Array } =
    mapModelToFileManifest(data);
  const folderName = replaceSpacesWithUnderscores(data.meta.title);
  if (runPy) {
    fileManifest["run.py"] = runPy;
  }
  if (runR) {
    fileManifest["run.R"] = runR;
  }

  // hack(?): actually include files in zip, when they're normally serialized for gists etc
  delete fileManifest[FileNames.EXTRA_DATA_MANIFEST];
  for (const { name, content } of data.extraDataFiles) {
    fileManifest[name] = content;
  }

  return [await serializeAsZip(folderName, fileManifest), folderName];
};

export const deserializeZipToFiles = async (zipBuffer: Uint8Array) => {
  const zip = await JSZip.loadAsync(zipBuffer);
  const dirNames: string[] = [];
  zip.forEach((relpath, file) => file.dir && dirNames.push(relpath));
  const folderName = dirNames[0] ?? "";
  if (!dirNames.every((n) => n === folderName)) {
    throw new Error("Multiple directories in zip file");
  }
  zip.forEach((_, file) => {
    if (!file.name.startsWith(folderName)) {
      throw new Error("Files are not all in a single folder");
    }
  });
  const folderLength = folderName.length;
  const files: { [name: string]: string } = {};

  const extraDataFiles: { name: string; b64contents: string }[] = [];
  // we want to use a traditional for loop here, since async doesn't do nicely with higher-order callbacks
  for (const name in zip.files) {
    const file = zip.files[name];
    if (file.dir) continue;
    const basename = name.substring(folderLength);
    if (Object.values(ProjectFileMap).includes(basename as FileNames)) {
      const content = await file.async("arraybuffer");
      const decoded = tryDecodeText(content);
      if (decoded === undefined) {
        throw new Error(`File ${basename} is not a valid text file`);
      }
      files[basename] = decoded;
    } else if (!["run.R", "run.py"].includes(basename)) {
      const content = await file.async("arraybuffer");
      const f = base64encode({
        name: basename,
        content: new Uint8Array(content),
      });
      extraDataFiles.push(f);
    }
  }
  if (extraDataFiles.length > 0) {
    files[FileNames.EXTRA_DATA_MANIFEST] = JSON.stringify(extraDataFiles);
  }

  return mapFileContentsToModel(files as Partial<FileRegistry>);
};

const loadMetaFromString = (
  data: ProjectDataModel,
  json: string,
  clearExisting: boolean = false,
): ProjectDataModel => {
  const newMeta = JSON.parse(json);
  if (!isProjectMetaData(newMeta)) {
    throw new Error("Deserialized meta is not valid");
  }
  const newMetaMember = clearExisting
    ? { ...newMeta }
    : { ...data.meta, ...newMeta };
  return { ...data, meta: newMetaMember };
};

const loadSamplingOptsFromString = (
  data: ProjectDataModel,
  json: string,
  clearExisting: boolean = false,
): ProjectDataModel => {
  const newSampling = parseSamplingOpts(json);
  const newSamplingOptsMember = clearExisting
    ? { ...newSampling }
    : { ...data.samplingOpts, ...newSampling };
  return { ...data, samplingOpts: newSamplingOptsMember };
};

const loadFileFromString = (
  data: ProjectDataModel,
  field: ProjectKnownFiles,
  contents: string,
): ProjectDataModel => {
  const newData = { ...data };
  newData[field] = contents;
  return newData;
};

const loadExtraDataFilesFromString = (
  data: ProjectDataModel,
  json: string,
): ProjectDataModel => {
  const newData = { ...data };
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) {
    throw new Error("Extra data files manifest is not an array");
  }
  for (const item of parsed) {
    if (typeof item.name !== "string" || typeof item.b64contents !== "string") {
      throw new Error(
        "Extra data files manifest items must have name and b64contents string properties",
      );
    }
  }
  const decodedFiles = parsed.map(base64decode);
  newData.extraDataFiles = decodedFiles;
  return newData;
};

export const loadFromProjectFiles = (
  data: ProjectDataModel,
  files: Partial<FieldsContentsMap>,
  clearExisting: boolean = false,
): ProjectDataModel => {
  let newData = clearExisting ? initialDataModel : data;
  if (Object.keys(files).includes("meta")) {
    newData = loadMetaFromString(newData, files.meta ?? "");
    delete files["meta"];
  }
  if (Object.keys(files).includes("samplingOpts")) {
    newData = loadSamplingOptsFromString(newData, files.samplingOpts ?? "");
    delete files["samplingOpts"];
  }
  if (Object.keys(files).includes("extraDataFiles")) {
    newData = loadExtraDataFilesFromString(newData, files.extraDataFiles ?? "");
    delete files["extraDataFiles"];
  }
  const fileKeys = Object.keys(files) as ProjectKnownFiles[];
  newData = fileKeys.reduce(
    (currData, currField) =>
      loadFileFromString(currData, currField, files[currField] ?? ""),
    newData,
  );
  newData = persistStateToEphemera(newData);
  return newData;
};
