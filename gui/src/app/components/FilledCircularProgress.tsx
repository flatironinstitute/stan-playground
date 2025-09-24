import CircularProgress, {
  circularProgressClasses,
  CircularProgressProps,
} from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";

// from https://github.com/mui/material-ui/blob/219380c625bcec5bfccde7f903626937c6071fd4/docs/data/material/components/progress/CustomizedProgressBars.tsx#L30
// In MUI 7+, we can use the `enableTrackSlot` prop instead
const FilledCircularProgress = (props: CircularProgressProps) => {
  return (
    <Stack direction="row" alignItems="center" sx={{ position: "relative" }}>
      <CircularProgress
        variant="determinate"
        sx={(theme) => ({
          color: theme.palette.grey[200],
          ...theme.applyStyles("dark", {
            color: theme.palette.grey[800],
          }),
        })}
        {...props}
        value={100}
      />
      <CircularProgress
        disableShrink
        sx={(theme) => ({
          color: theme.palette.primary.main,
          animationDuration: "550ms",
          position: "absolute",
          left: 0,
          [`& .${circularProgressClasses.circle}`]: {
            strokeLinecap: "round",
          },
          ...theme.applyStyles("dark", {
            color: theme.palette.primary.dark,
          }),
        })}
        {...props}
      />
    </Stack>
  );
};

export default FilledCircularProgress;
