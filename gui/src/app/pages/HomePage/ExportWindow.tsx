import { FunctionComponent, useContext } from "react";

import { mapModelToFileManifest } from "../../Project/FileMapping";
import { ProjectContext } from "../../Project/ProjectContextProvider";
import { serializeAsZip } from "../../Project/ProjectSerialization";
import { triggerDownload } from "../../util/triggerDownload";

type ExportWindowProps = {
  onClose: () => void;
};

const ExportWindow: FunctionComponent<ExportWindowProps> = ({ onClose }) => {
  const { data, update } = useContext(ProjectContext);
  const fileManifest = mapModelToFileManifest(data);

  return (
    <div>
      <h3>Export this project</h3>
      <table className="table1">
        <tbody>
          <tr>
            <td>Title</td>
            <td>
              <EditTitleComponent
                value={data.meta.title}
                onChange={(newTitle: string) =>
                  update({ type: "retitle", title: newTitle })
                }
              />
            </td>
          </tr>
          {Object.entries(fileManifest).map(([name, content], i) => (
            <tr key={i}>
              <td>{name}</td>
              <td>{content.length} bytes</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <button
          onClick={async () => {
            serializeAsZip(data).then(([zipBlob, name]) =>
              triggerDownload(zipBlob, `SP-${name}.zip`, onClose),
            );
          }}
        >
          Export to .zip file
        </button>
      </div>
    </div>
  );
};

type EditTitleComponentProps = {
  value: string;
  onChange: (value: string) => void;
};

const EditTitleComponent: FunctionComponent<EditTitleComponentProps> = ({
  value,
  onChange,
}) => {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export default ExportWindow;
