// by default, MUI grids are only responsive to the viewport width
// not their container. This is based on the solution in
// https://github.com/mui/material-ui/issues/25189#issuecomment-1321236185

import { styled } from "@mui/material/styles";
import { FunctionComponent, JSX } from "react";

const Container = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
  containerType: "inline-size",
});

const Item = styled("div")(({ theme }) => ({
  width: "95%",
  margin: "0 auto",
  [theme.containerQueries.up("md")]: {
    width: "calc(50% - 4px)",
  },
  [theme.containerQueries.up("lg")]: {
    width: "calc(100% / 4 - 12px)",
  },
}));

type Props = {
  children: JSX.Element[];
};

const ResponsiveGrid: FunctionComponent<Props> = ({ children }) => {
  return (
    <Container>
      {children.map((child, i) => (
        <Item key={i}>{child}</Item>
      ))}
    </Container>
  );
};

export default ResponsiveGrid;
