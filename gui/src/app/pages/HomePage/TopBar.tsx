/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent } from "react";
import CompilationServerConnectionControl from "../../CompilationServerConnectionControl/CompilationServerConnectionControl";
import { SmallIconButton } from "@fi-sci/misc";
import { QuestionMark } from "@mui/icons-material";
import useRoute from "../../useRoute";
import { Toolbar } from "@mui/material";


type TopBarProps = {
  width: number
  height: number
}

const TopBar: FunctionComponent<TopBarProps> = () => {
  const { route, setRoute } = useRoute()
  if (route.page !== 'home') {
    throw Error('Unexpected route')
  }
  return (
    <div>
      <Toolbar style={{minHeight: 20}}>
        Stan Playground - {route.title}
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
