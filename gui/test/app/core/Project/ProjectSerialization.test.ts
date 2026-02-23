import {
  FileNames,
  mapFileContentsToModel,
  mapModelToFileManifest,
} from "@SpCore/Project/FileMapping";
import {
  initialDataModel,
  persistStateToEphemera,
} from "@SpCore/Project/ProjectDataModel";
import {
  deserializeProjectFromString,
  deserializeProjectFromURLParameter,
  deserializeZipToFiles,
  loadFromProjectFiles,
  serializeProjectToString,
  serializeProjectToURLParameter,
  serializeProjectToZip,
} from "@SpCore/Project/ProjectSerialization";
import { encodeTextFile } from "@SpUtil/files";
import JSZip from "jszip";
import { describe, expect, test } from "vitest";

describe("Serialization of projects", () => {
  const project = persistStateToEphemera({
    ...initialDataModel,
    stanFileContent: "// stan code here",
    dataPyFileContent: "# data py code here",
    analysisRFileContent: "# analysis R code here",
    meta: { title: "Test Project" },
    extraDataFiles: [
      encodeTextFile("data1.csv", "col1,col2\n1,2\n3,4"),
      encodeTextFile("data2.csv", "colA,colB\n5,6\n7,8"),
      {
        name: "binary.dat",
        content: new Uint8Array([0, 255, 128, 64, 32, 0, 1, 2, 3, 4]),
      },
    ],
  });

  test("Round-trips project data through string", () => {
    const storage = serializeProjectToString(project);
    const model = deserializeProjectFromString(storage);

    expect(model).toEqual(project);
  });

  test("Round-trips project data through URL parameter", () => {
    const storage = serializeProjectToURLParameter(project);
    const model = deserializeProjectFromURLParameter(storage);

    expect(model).toEqual(project);
  });

  test("Round-trips project data through file mapping", () => {
    const fileRegistry = mapModelToFileManifest(project);
    const fieldContents = mapFileContentsToModel(fileRegistry);
    const model = loadFromProjectFiles(fieldContents);

    expect(model).toEqual(project);
  });

  test("Round-trips project data through zip files", async () => {
    const [zipBlob] = await serializeProjectToZip(
      project,
      null,
      "run R content",
    );
    const zipBuffer = new Uint8Array(await zipBlob.arrayBuffer());

    // assert that we actually zip the extra files as files, not as json in the manifest
    const zip = await JSZip.loadAsync(zipBuffer);
    expect(Object.keys(zip.files)).toContain("Test_Project/data1.csv");
    expect(Object.keys(zip.files)).toContain("Test_Project/data2.csv");
    expect(Object.keys(zip.files)).toContain("Test_Project/binary.dat");
    expect(Object.keys(zip.files)).not.toContain(
      "Test_Project/extra_data_files.json",
    );

    const fieldContents = await deserializeZipToFiles(zipBuffer);
    const model = loadFromProjectFiles(fieldContents);

    expect(model).toEqual(project);
  });

  test("Extra data files are encoded as text", () => {
    const fileRegistry = mapModelToFileManifest(project);

    expect(Object.keys(fileRegistry)).toEqual(Object.values(FileNames));

    expect(fileRegistry["extra_data_files.json"]).toBeTypeOf("string");
  });
});
