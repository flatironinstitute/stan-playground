import { FunctionComponent, PropsWithChildren } from "react";

import { ArrowDropDown } from "@mui/icons-material";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";

type CollapsableProps = {
  name: string;
};

const Collapsable: FunctionComponent<PropsWithChildren<CollapsableProps>> = ({
  name,
  children,
}) => {
  return (
    <Accordion slotProps={{ transition: { unmountOnExit: true } }}>
      <AccordionSummary expandIcon={<ArrowDropDown />}>{name}</AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
};

export default Collapsable;
