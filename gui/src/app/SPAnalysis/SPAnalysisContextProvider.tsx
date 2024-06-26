import { initialDataModel, SPAnalysisDataModel } from "./SPAnalysisDataModel"
import { createContext, FunctionComponent, PropsWithChildren, useCallback, useEffect, useReducer } from "react"
import { SPAnalysisReducer, SPAnalysisReducerAction, SPAnalysisReducerType } from "./SPAnalysisReducer"
import { useSearchParams } from "react-router-dom"
import { deserializeAnalysisFromLocalStorage, serializeAnalysisToLocalStorage } from "./SPAnalysisSerialization"
import { fromSearchParams, fetchRemoteAnalysis } from "./SPAnalysisQueryLoading"

type SPAnalysisContextType = {
    data: SPAnalysisDataModel
    update: React.Dispatch<SPAnalysisReducerAction>
}

type SPAnalysisContextProviderProps = {
}

export const SPAnalysisContext = createContext<SPAnalysisContextType>({
    data: initialDataModel,
    update: () => { }
})


const SPAnalysisContextProvider: FunctionComponent<PropsWithChildren<SPAnalysisContextProviderProps>> = ({ children }) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const onDirty = useCallback(() => {
        // whenever the data state is 'dirty', we want to
        // clear the URL bar as to indiciate that the viewed content is
        // no longer what the link would point to
        if (searchParams.size !== 0)
            setSearchParams(new URLSearchParams())
    }, [searchParams, setSearchParams]);


    const [data, update] = useReducer<SPAnalysisReducerType>(SPAnalysisReducer(onDirty), initialDataModel)

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
    ////////////////////////////////////////////////////////////////////////////////////////


    useEffect(() => {
        if (data != initialDataModel) return;

        const query = fromSearchParams(searchParams);

        // any query is set
        if (Object.values(query).some(v => v !== null)) {
            fetchRemoteAnalysis(query).then((data) => {
                update({ type: 'loadInitialData', state: data })
            })
        } else {
            // load the saved state on first load
            const savedState = localStorage.getItem('stan-playground-saved-state')
            if (!savedState) return
            const parsedData = deserializeAnalysisFromLocalStorage(savedState)
            update({ type: 'loadInitialData', state: parsedData })
        }

    }, [data, searchParams])

    return (
        <SPAnalysisContext.Provider value={{ data, update }}>
            {children}
        </SPAnalysisContext.Provider>
    )
}

export default SPAnalysisContextProvider

