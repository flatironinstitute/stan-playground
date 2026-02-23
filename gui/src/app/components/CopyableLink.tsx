import { FunctionComponent } from "react";

import IconButton from "@mui/material/IconButton";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Stack from "@mui/material/Stack";
import Link from "@mui/material/Link";
import Tooltip from "@mui/material/Tooltip";

type Props = {
  link: string;
};

const CopyableLink: FunctionComponent<Props> = ({ link }) => {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Link href={link} target="_blank" rel="noreferrer" noWrap>
        {link}
      </Link>
      <Tooltip title="Copy link to clipboard">
        <IconButton
          onClick={() => {
            navigator.clipboard.writeText(link);
          }}
          aria-label="copy"
          size="small"
        >
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

export default CopyableLink;
