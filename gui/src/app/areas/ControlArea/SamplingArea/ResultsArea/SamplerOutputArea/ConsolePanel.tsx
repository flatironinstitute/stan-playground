import Box from "@mui/material/Box";
import type { ConsoleMessage } from "@SpCore/StanSampler/SamplerTypes";

import { FunctionComponent } from "react";

type ConsoleProps = {
  messages: ConsoleMessage[];
};

const ConsolePanel: FunctionComponent<ConsoleProps> = ({ messages }) => {
  return (
    <>
      {messages.map((msg, index) => (
        <Box
          key={index}
          className="stdout"
          color={msg.type === "error" ? "error.main" : "info.dark"}
        >
          <pre>{msg.text}</pre>
        </Box>
      ))}
    </>
  );
};

export default ConsolePanel;
