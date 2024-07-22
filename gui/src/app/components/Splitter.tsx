// @devbookhq/splitter has a known issue, https://github.com/DevbookHQ/splitter/issues/11,
// where re-renders of internal components can cause the splitter to lose its state.
// This wrapper captures the splitter sizes and stores them in a state to avoid this issue.
import DevbookSplit, {
  SplitDirection as DevbookSplitDirection,
  GutterTheme as DevbookGutterTheme,
} from "@devbookhq/splitter";
import {
  FunctionComponent,
  useState,
  useCallback,
  PropsWithChildren,
  useEffect,
} from "react";

interface SplitterProps {
  direction?: keyof typeof DevbookSplitDirection;
  minWidths?: number[];
  minHeights?: number[];
  initialSizes?: number[];
  gutterTheme?: keyof typeof DevbookGutterTheme;
  gutterClassName?: string;
  draggerClassName?: string;
  onResizeStarted?: (pairIdx: number) => void;
  onResizeFinished?: (pairIdx: number, newSizes: number[]) => void;
  classes?: string[];
}

export const SplitDirection = DevbookSplitDirection;
export const GutterTheme = DevbookGutterTheme;

export const Splitter: FunctionComponent<PropsWithChildren<SplitterProps>> = ({
  direction = "Horizontal",
  gutterTheme = "Light",
  children,
  initialSizes,
  ...props
}) => {
  const [persistentSizes, setPersistentSizes] = useState<number[] | undefined>(
    initialSizes,
  );

  useEffect(() => {
    setPersistentSizes(initialSizes);
  }, [initialSizes]);

  const handleResizeFinished = useCallback((_: number, newSizes: number[]) => {
    setPersistentSizes(newSizes);
  }, []);

  return (
    <DevbookSplit
      direction={DevbookSplitDirection[direction]}
      gutterTheme={DevbookGutterTheme[gutterTheme]}
      onResizeFinished={handleResizeFinished}
      initialSizes={persistentSizes}
      {...props}
    >
      {children}
    </DevbookSplit>
  );
};
