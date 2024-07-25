import { FunctionComponent, RefObject } from "react";
import ScriptEditor, { ScriptEditorProps } from "./ScriptEditor";
import { SplitDirection, Splitter } from "@SpComponents/Splitter";

const PlottingScriptEditor: FunctionComponent<
  ScriptEditorProps & { imagesRef: RefObject<HTMLDivElement> }
> = (props) => {
  return (
    <Splitter direction={SplitDirection.Horizontal}>
      <ScriptEditor {...props} />
      <ImageOutputWindow imagesRef={props.imagesRef} />
    </Splitter>
  );
};

type ImageOutputWindowProps = {
  imagesRef: RefObject<HTMLDivElement>;
};

const ImageOutputWindow: FunctionComponent<ImageOutputWindowProps> = ({
  imagesRef,
}) => {
  return <div className="ImageOutputArea" ref={imagesRef} />;
};

export default PlottingScriptEditor;
