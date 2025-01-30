import { FunctionComponent, RefObject } from "react";
import ScriptEditor, { ScriptEditorProps } from "./ScriptEditor";
import { Split } from "@geoffcox/react-splitter";

const PlottingScriptEditor: FunctionComponent<
  ScriptEditorProps & { imagesRef: RefObject<HTMLDivElement | null> }
> = (props) => {
  return (
    <Split>
      <ScriptEditor {...props} />
      <ImageOutputPanel imagesRef={props.imagesRef} />
    </Split>
  );
};

type ImageOutputProps = {
  imagesRef: RefObject<HTMLDivElement | null>;
};

const ImageOutputPanel: FunctionComponent<ImageOutputProps> = ({
  imagesRef,
}) => {
  return <div className="ImageOutputArea" ref={imagesRef} />;
};

export default PlottingScriptEditor;
