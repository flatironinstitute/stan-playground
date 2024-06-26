import { createContext, FunctionComponent, PropsWithChildren, useEffect, useReducer } from "react"
import { initialDataModel, SPAnalysisDataModel } from "./SPAnalysisDataModel"
import { SPAnalysisReducer, SPAnalysisReducerAction, SPAnalysisReducerType } from "./SPAnalysisReducer"
import { deserializeAnalysisFromLocalStorage, serializeAnalysisToLocalStorage } from "./SPAnalysisSerialization"

type SPAnalysisContextType = {
    data: SPAnalysisDataModel
    update: React.Dispatch<SPAnalysisReducerAction>
}

type SPAnalysisContextProviderProps = {
}

export const SPAnalysisContext = createContext<SPAnalysisContextType>({
    data: initialDataModel,
    update: () => {}
})

const SPAnalysisContextProvider: FunctionComponent<PropsWithChildren<SPAnalysisContextProviderProps>> = ({children}) => {
    const [data, update] = useReducer<SPAnalysisReducerType>(SPAnalysisReducer, initialDataModel)

    ////////////////////////////////////////////////////////////////////////////////////////
    // For convenience, we save the state to local storage so it is available on
    // reload of the page But this will be revised in the future to use a more
    // sophisticated storage mechanism.
    useEffect(() => {
        // as user reloads the page or closes the tab, save state to local storage
        const handleBeforeUnload = () => {
            const state = serializeAnalysisToLocalStorage(data)
            localStorage.setItem('stan-playground-saved-state', state)
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [data])

    useEffect(() => {
        // load the saved state on first load
        const savedState = localStorage.getItem('stan-playground-saved-state')
        if (!savedState) return
        const parsedData = deserializeAnalysisFromLocalStorage(savedState)
        update({ type: 'loadLocalStorage', state: parsedData })
    }, [])
    ////////////////////////////////////////////////////////////////////////////////////////

    return (
        <SPAnalysisContext.Provider value={{data, update}}>
            {children}
        </SPAnalysisContext.Provider>
    )
}

export default SPAnalysisContextProvider

