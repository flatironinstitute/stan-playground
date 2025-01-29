import Box from "@mui/material/Box";

import { FunctionComponent } from "react";

type ConsoleProps = {
  text: string;
};

const ConsolePanel: FunctionComponent<ConsoleProps> = ({ text }) => {
  return (
    <Box className="stdout" color="info.dark">
      <pre>{text}</pre>
    </Box>
  );
};

export default ConsolePanel;
