import { FunctionComponent } from "react";

import CopyableLink from "@SpComponents/CopyableLink";

type InvitationToShareAreaProps = {
  project: string;
};

export const InvitationToShareArea: FunctionComponent<
  InvitationToShareAreaProps
> = ({ project }) => {
  return (
    <>
      <p>
        You can now share the following link to this Stan Playground project:
      </p>
      <CopyableLink link={makeSPShareableLink(project)} />
      <br />
    </>
  );
};

const makeSPShareableLink = (project: string) => {
  const protocol = window.location.protocol;
  const host = window.location.host;
  const url = `${protocol}//${host}?project=${project}`;
  return url;
};
