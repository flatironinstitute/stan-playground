/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent } from "react";
import { Fiddle } from "../../FromJpfiddle/JpfiddleContext/JpfiddleContext";
import CompilationServerConnectionControl from "../../CompilationServerConnectionControl/CompilationServerConnectionControl";
import { SmallIconButton } from "@fi-sci/misc";
import { QuestionMark } from "@mui/icons-material";
import useRoute from "../../useRoute";
import { Toolbar } from "@mui/material";


type TopBarProps = {
  width: number
  height: number
  cloudFiddle: Fiddle | undefined
  fiddleUri?: string
}

const TopBar: FunctionComponent<TopBarProps> = ({cloudFiddle}) => {
  const { setRoute } = useRoute()
  return (
    <div>
      <Toolbar style={{minHeight: 20}}>
        Stan Playground - {cloudFiddle?.jpfiddle?.title}
        <span style={{marginLeft: 'auto'}} />
        <CompilationServerConnectionControl />
        <span>
            <SmallIconButton
                icon={<QuestionMark />}
                onClick={() => setRoute({page: 'about'})}
                title={`About Stan Playground`}
            />
        </span>
      </Toolbar>
    </div>
  )
}

export default TopBar;
