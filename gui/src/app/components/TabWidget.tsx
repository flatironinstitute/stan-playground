/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, useEffect, useState } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";

type TabWidgetProps = {
  labels: string[];
  children: JSX.Element[];
};

const TabWidget: FunctionComponent<TabWidgetProps> = ({ labels, children }) => {
  if (labels.length !== children.length) {
    throw new Error("Number of labels and children must match");
  }

  const [index, setIndex] = useState(0);
  const [tabsThatHaveBeenViewed, setTabsThatHaveBeenViewed] = useState<
    number[]
  >([]);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabsThatHaveBeenViewed((prev) => {
      if (!prev.includes(newValue)) {
        return [...prev, newValue];
      }
      return prev;
    });
    setIndex(newValue);
  };

  return (
    <Box display="flex" height="100%" width="100%" flexDirection="column">
      <Tabs value={index} onChange={handleChange}>
        {labels.map((label, i) => (
          <Tab key={i} label={label} />
        ))}
      </Tabs>
      <Box flex="1" overflow="scroll">
        {children.map((child, i) => (
          <CustomTabPanel
            key={i}
            value={index}
            index={i}
            mounted={tabsThatHaveBeenViewed.includes(i)}
          >
            {child}
          </CustomTabPanel>
        ))}
      </Box>
    </Box>
  );
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  mounted: boolean;
  value: number;
}

const CustomTabPanel = (props: TabPanelProps) => {
  const { children, value, index, mounted, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      style={{ height: "100%", width: "100%" }}
      {...other}
    >
      {(value === index || mounted) && <>{children}</>}
    </div>
  );
};

export default TabWidget;
