import {
  ProjectDataModel,
  ProjectPersistentDataModel,
  stringifyField,
} from "@SpCore/ProjectDataModel";

// This code exists to provide rigorous definitions for the mappings between
// the in-memory representation of a Stan Playground project (i.e. the
// ProjectDataModel) and the on-disk representation of its parts, as (for example)
// when downloading or uploading a zip.
//
// Effectively, we need to map among three things:
//   1. the fields of the in-memory data model
//   2. the names of the on-disk/in-zip files
//   3. the actual contents of those on-disk files
// We need the link between 1-2 to serialize the data model fields to files, and
// between 2-3 for deserialization from files.

// Mechanically, we'll also want an exhaustive list of the filenames we will use
// (that's the FileNames enum).

export enum FileNames {
  META = "meta.json",
  SAMPLING = "sampling_opts.json",
  STANFILE = "main.stan",
  DATAFILE = "data.json",
  ANALYSISPYFILE = "analysis.py",
  DATAPYFILE = "data.py",
  DATARFILE = "data.R",
}

// FileMapType enforces an exhaustive mapping from data-model fields to the
// known file names that store those fields. (This is the 1-2 leg of the
// triangle).
type FileMapType = {
  [name in keyof ProjectPersistentDataModel]: FileNames;
};

// This dictionary stores the actual (global) fields-to-file-names map.
// Because it's of type FileMapType, it enforces that every key in the
// data model (except the "ephemera" key, which is not to be preserved)
// maps to some file name
export const ProjectFileMap: FileMapType = {
  meta: FileNames.META,
  samplingOpts: FileNames.SAMPLING,
  stanFileContent: FileNames.STANFILE,
  dataFileContent: FileNames.DATAFILE,
  analysisPyFileContent: FileNames.ANALYSISPYFILE,
  dataPyFileContent: FileNames.DATAPYFILE,
  dataRFileContent: FileNames.DATARFILE,
};

// The FileRegistry is the 2-3 leg of the triangle: it maps the known file names
// to their actual contents when read from disk.
// Since we don't *actually* want to mandate that all the known files
// are present, it'll almost always be used in a Partial<>.
// But this way, during deserialization, we can associate the (string) data with
// the file it came from, and the file with the field of the data model, so we
// know how to (re)populate the data model.
export type FileRegistry = {
  [name in FileNames]: string;
};

// This is a serialization function that maps a data model to a FileRegistry,
// i.e. a dictionary mapping the intended file names to their intended contents.
export const mapModelToFileManifest = (
  data: ProjectDataModel,
): Partial<FileRegistry> => {
  const fileManifest: Partial<FileRegistry> = {};
  const fields = Object.keys(ProjectFileMap) as (keyof ProjectDataModel)[];
  fields.forEach((k) => {
    if (k === "ephemera") return;
    const key = ProjectFileMap[k];
    fileManifest[key] = stringifyField(data, k);
  });
  return fileManifest;
};

// This is used during deserialization as an intermediate representation.
// It maps the (named) fields of the data model to the string representation of their
// contents as was written into the file representation.
// During actual deserialization, special case files can be deserialized as needed,
// and the actual file list can just be mapped directly.
export type FieldsContentsMap = {
  [name in keyof ProjectPersistentDataModel]: string;
};

// This is the inverse of the ProjectFileMap dictionary; with the bonus that it actually
// populates the fields.
export const mapFileContentsToModel = (
  files: Partial<FileRegistry>,
): Partial<FieldsContentsMap> => {
  const fields = Object.keys(files);
  const theMap: Partial<FieldsContentsMap> = {};
  fields.forEach((f) => {
    switch (f) {
      case FileNames.META: {
        theMap.meta = files[f];
        break;
      }
      case FileNames.DATAFILE: {
        theMap.dataFileContent = files[f];
        break;
      }
      case FileNames.STANFILE: {
        theMap.stanFileContent = files[f];
        break;
      }
      case FileNames.ANALYSISPYFILE: {
        theMap.analysisPyFileContent = files[f];
        break;
      }
      case FileNames.DATAPYFILE: {
        theMap.dataPyFileContent = files[f];
        break;
      }
      case FileNames.DATARFILE: {
        theMap.dataRFileContent = files[f];
        break;
      }
      case FileNames.SAMPLING: {
        theMap.samplingOpts = files[f];
        break;
      }
      default:
        // Don't do anything for unrecognized filenames
        break;
    }
  });
  return theMap;
};
