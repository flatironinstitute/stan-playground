import Box from "@mui/material/Box";

import { FunctionComponent } from "react";

type ConsoleOutputProps = {
  text: string;
};

const ConsoleOutput: FunctionComponent<ConsoleOutputProps> = ({ text }) => {
  return (
    <Box className="stdout" color="info.dark">
      <pre>{text}</pre>
    </Box>
  );
};

export default ConsoleOutput;
