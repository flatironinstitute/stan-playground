import {
  FieldsContentsMap,
  FileNames,
  FileRegistry,
  ProjectFileMap,
  mapFileContentsToModel,
  mapModelToFileManifest,
} from "@SpCore/FileMapping";
import {
  ProjectDataModel,
  ProjectKnownFiles,
  getStringKnownFileKeys,
  initialDataModel,
  isProjectDataModel,
  isProjectMetaData,
  parseSamplingOpts,
  persistStateToEphemera,
} from "@SpCore/ProjectDataModel";
import { replaceSpacesWithUnderscores } from "@SpUtil/replaceSpaces";
import JSZip from "jszip";

export const serializeProjectToLocalStorage = (
  data: ProjectDataModel,
): string => {
  const intermediary = {
    ...data,
    ephemera: undefined,
  };
  return JSON.stringify(intermediary);
};

export const deserializeProjectFromLocalStorage = (
  serialized: string,
): ProjectDataModel | undefined => {
  try {
    const intermediary = JSON.parse(serialized);
    // Not sure if this is strictly necessary
    intermediary.ephemera = {};
    const stringFileKeys = getStringKnownFileKeys();
    stringFileKeys.forEach((k) => (intermediary.ephemera[k] = intermediary[k]));
    if (!isProjectDataModel(intermediary)) {
      console.warn(intermediary);
      throw Error("Deserialized data is not a valid ProjectDataModel");
    }
    return intermediary;
  } catch (e) {
    console.error("Error deserializing data from local storage", e);
    return undefined;
  }
};

export const serializeAsZip = async (
  data: ProjectDataModel,
): Promise<[Blob, string]> => {
  const fileManifest = mapModelToFileManifest(data);
  const folderName = replaceSpacesWithUnderscores(data.meta.title);
  const zip = new JSZip();
  const folder = zip.folder(folderName);
  if (!folder) {
    throw new Error("Error creating folder in zip file");
  }
  Object.entries(fileManifest).forEach(([name, content]) => {
    if (content.trim() !== "") {
      folder.file(name, content);
    }
  });
  const zipBlob = await zip.generateAsync({ type: "blob" });

  return [zipBlob, folderName];
};

export const parseFile = (fileBuffer: ArrayBuffer) => {
  const content = new TextDecoder().decode(fileBuffer);
  return content;
};

export const deserializeZipToFiles = async (zipBuffer: ArrayBuffer) => {
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
  // we want to use a traditional for loop here, since async doesn't do nicely with higher-order callbacks
  for (const name in zip.files) {
    const file = zip.files[name];
    if (file.dir) continue;
    const basename = name.substring(folderLength);
    if (Object.values(ProjectFileMap).includes(basename as FileNames)) {
      const content = await file.async("arraybuffer");
      const decoded = new TextDecoder().decode(content);
      files[basename] = decoded;
    } else {
      throw new Error(
        `Unrecognized file in zip: ${file.name} (basename ${basename})`,
      );
    }
  }
  return mapFileContentsToModel(files as Partial<FileRegistry>);
};

const loadMetaFromString = (
  data: ProjectDataModel,
  json: string,
  clearExisting: boolean = false,
): ProjectDataModel => {
  let newMeta = JSON.parse(json);
  if (!isProjectMetaData(newMeta)) {
    throw Error("Deserialized meta is not valid");
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
  const fileKeys = Object.keys(files) as ProjectKnownFiles[];
  newData = fileKeys.reduce(
    (currData, currField) =>
      loadFileFromString(currData, currField, files[currField] ?? ""),
    newData,
  );
  newData = persistStateToEphemera(newData);
  return newData;
};
