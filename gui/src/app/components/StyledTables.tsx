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
  },
}));

export const SuccessColoredTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: theme.palette.success.light,
  th: {
    color: theme.palette.success.contrastText,
  },
}));
