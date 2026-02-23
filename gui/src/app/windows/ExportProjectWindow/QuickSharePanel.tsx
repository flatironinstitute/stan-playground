import { FunctionComponent } from "react";
import Button from "@mui/material/Button";

import { serializeProjectToURLParameter } from "@SpCore/Project/ProjectSerialization";
import { ProjectDataModel } from "@SpCore/Project/ProjectDataModel";
import { InvitationToShareArea } from "./InvitationToShareArea";

type Props = {
  data: ProjectDataModel;
  onClose: () => void;
};

const QuickSharePanel: FunctionComponent<Props> = ({ data, onClose }) => {
  const project = serializeProjectToURLParameter(data);
  return (
    <div className="GistExplainer">
      <p>
        Quick share creates a link that contains the entire contents of your
        projected encoded in the URL. This is convienent but makes it difficult
        to view the contents outside of Stan Playground, and browser-specific
        length limits on URLs may lead to very large projects failing to load
        when shared in this method.
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
