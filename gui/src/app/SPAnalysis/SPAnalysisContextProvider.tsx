import { initialDataModel, SPAnalysisDataModel } from "./SPAnalysisDataModel"
import { createContext, FunctionComponent, PropsWithChildren, useEffect, useReducer } from "react"
import { SPAnalysisReducer, SPAnalysisReducerAction, SPAnalysisReducerType } from "./SPAnalysisReducer"
import { deserializeAnalysisFromLocalStorage, serializeAnalysisToLocalStorage } from "./SPAnalysisSerialization"
import { fetchRemoteAnalysis, queryStringHasParameters, useQueryParams } from "./SPAnalysisQueryLoading"

type SPAnalysisContextType = {
    data: SPAnalysisDataModel
    update: React.Dispatch<SPAnalysisReducerAction>
}

type SPAnalysisContextProviderProps = {
    //
}

export const SPAnalysisContext = createContext<SPAnalysisContextType>({
    data: initialDataModel,
    update: () => { }
})


const SPAnalysisContextProvider: FunctionComponent<PropsWithChildren<SPAnalysisContextProviderProps>> = ({ children }) => {

    const { queries, clearSearchParams } = useQueryParams();

    const [data, update] = useReducer<SPAnalysisReducerType>(SPAnalysisReducer(clearSearchParams), initialDataModel)

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
        if (data != initialDataModel) return;

        if (queryStringHasParameters(queries)) {
            fetchRemoteAnalysis(queries).then((data) => {
                update({ type: 'loadInitialData', state: data })
            })
        } else {
            // load the saved state on first load
            const savedState = localStorage.getItem('stan-playground-saved-state')
            if (!savedState) return
            const parsedData = deserializeAnalysisFromLocalStorage(savedState)
            if (!parsedData) return // unsuccessful parse or type cast
            update({ type: 'loadInitialData', state: parsedData })
        }

    }, [data, queries])

    return (
        <SPAnalysisContext.Provider value={{ data, update }}>
            {children}
        </SPAnalysisContext.Provider>
    )
}

export default SPAnalysisContextProvider

