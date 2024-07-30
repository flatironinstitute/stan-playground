import { FunctionComponent, RefObject } from "react";
import ScriptEditor, { ScriptEditorProps } from "./ScriptEditor";
import { Split } from "@geoffcox/react-splitter";

const PlottingScriptEditor: FunctionComponent<
  ScriptEditorProps & { imagesRef: RefObject<HTMLDivElement> }
> = (props) => {
  return (
    <Split>
      <ScriptEditor {...props} />
      <ImageOutputWindow imagesRef={props.imagesRef} />
    </Split>
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
