import { styled } from "@mui/material/styles";
import TableRow from "@mui/material/TableRow";
import TableHead from "@mui/material/TableHead";

export const AlternatingTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.focus,
  },
}));

export const SecondaryColoredTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: theme.palette.secondary.light,
  th: {
    color: theme.palette.secondary.contrastText,
    backgroundColor: theme.palette.secondary.light,
    whiteSpace: "nowrap",
    paddingRight: "0.5rem",
  },
}));

export const SuccessColoredTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: theme.palette.success.light,
  th: {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
    whiteSpace: "nowrap",
    paddingRight: "0.5rem",
    borderBottom: "2px solid " + theme.palette.success.main,
  },
}));

export const SuccessBorderedTableRow = styled(AlternatingTableRow)(
  ({ theme }) => ({
    "&:last-of-type": {
      borderBottom: "2px solid " + theme.palette.success.main,
    },
  }),
);
