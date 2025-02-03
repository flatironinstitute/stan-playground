import { FunctionComponent } from "react";

import CircularProgress from "@mui/material/CircularProgress";

type Props = {
  name: string;
};

const Loading: FunctionComponent<Props> = ({ name }) => {
  return (
    <div className="Loading">
      <CircularProgress color="info" />
      <p className="details">Loading {name}</p>
    </div>
  );
};

export default Loading;
