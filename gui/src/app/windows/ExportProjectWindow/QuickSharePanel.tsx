import { FunctionComponent } from "react";
import Button from "@mui/material/Button";

import { serializeProjectToURLParameter } from "@SpCore/Project/ProjectSerialization";
import { ProjectDataModel } from "@SpCore/Project/ProjectDataModel";
import {
  InvitationToShareArea,
  makeSPShareableLink,
} from "./InvitationToShareArea";

type Props = {
  data: ProjectDataModel;
  onClose: () => void;
  onBack: () => void;
};

// some manual testing has found that this is the point at which
// Vercel starts responding with 414 URI Too Long
const VERCEL_URI_LIMIT = 32_800;

const QuickSharePanel: FunctionComponent<Props> = ({
  data,
  onClose,
  onBack,
}) => {
  const project = serializeProjectToURLParameter(data);

  if (makeSPShareableLink(project).length >= VERCEL_URI_LIMIT) {
    return (
      <div className="ExportExplainer">
        <p>
          Unfortunately, this project is too large to be shared via Quick Share
          due to URL length limits. We recommend sharing larger projects by
          exporting to a .zip file or GitHub Gist.
        </p>
        <Button onClick={onBack}>Back</Button>
      </div>
    );
  }

  return (
    <div className="ExportExplainer">
      <p>
        Quick share creates a link that contains the entire contents of your
        projected encoded in the URL. This is convienent but makes it difficult
        to view the contents outside of Stan Playground, and is not available
        for larger projects due to URL length limits.
        <br />
        For larger projects, we recommend exporting to a .zip file or GitHub
        Gist.
        <br />
      </p>
      <InvitationToShareArea project={project} />
      <Button onClick={onClose}>Close</Button>
    </div>
  );
};

export default QuickSharePanel;
