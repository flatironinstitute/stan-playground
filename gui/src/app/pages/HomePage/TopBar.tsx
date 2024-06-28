/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent } from "react";
import CompilationServerConnectionControl from "../../CompilationServerConnectionControl/CompilationServerConnectionControl";
import { SmallIconButton } from "@fi-sci/misc";
import { QuestionMark } from "@mui/icons-material";
import { Toolbar } from "@mui/material";

type TopBarProps = {
  title: string;
  width: number;
  height: number;
};

const TopBar: FunctionComponent<TopBarProps> = ({ title }) => {
  return (
    <div>
      <Toolbar style={{ minHeight: 20 }}>
        Stan Playground - {title}
        <span style={{ marginLeft: "auto" }} />
        <CompilationServerConnectionControl />
        <span>
          <SmallIconButton
            icon={<QuestionMark />}
            onClick={() => {
              window.open(
                "https://github.com/flatironinstitute/stan-playground",
                "_blank",
              );
            }}
            title={`About Stan Playground`}
          />
        </span>
      </Toolbar>
    </div>
  );
};

export default TopBar;
