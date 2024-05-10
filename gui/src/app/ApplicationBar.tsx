import { SmallIconButton } from "@fi-sci/misc";
import { QuestionMark } from "@mui/icons-material";
import { AppBar, Toolbar } from "@mui/material";
import { FunctionComponent, useCallback } from "react";
import useRoute from "./useRoute";
import CompilationServerConnectionControl from "./CompilationServerConnectionControl/CompilationServerConnectionControl";

export const applicationBarColor = '#bac'
export const applicationBarColorDarkened = '#546'

type Props = {
    // none
}

export const applicationBarHeight = 45

const logoUrl = `/stan-playground-logo.png`

const ApplicationBar: FunctionComponent<Props> = () => {
    const {setRoute} = useRoute()

    const onHome = useCallback(() => {
        setRoute({page: 'home'})
    }, [setRoute])

    // light greenish background color for app bar
    // const barColor = '#e0ffe0'

    const barColor = '#656565'

    // const bannerColor = '#00a000'
    const titleColor = 'white'
    // const bannerColor = titleColor

    // const star = <span style={{color: bannerColor, fontSize: 20}}>★</span>

    return (
        <span>
            <AppBar position="static" style={{height: applicationBarHeight - 10, color: 'black', background: barColor}}>
                <Toolbar style={{minHeight: applicationBarHeight - 10}}>
                    <img src={logoUrl} alt="logo" height={30} style={{paddingBottom: 5, cursor: 'pointer'}} onClick={onHome} />
                    <div onClick={onHome} style={{cursor: 'pointer', color: titleColor}}>&nbsp;&nbsp;&nbsp;Stan Playground</div>
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
            </AppBar>
        </span>
    )
}

export default ApplicationBar