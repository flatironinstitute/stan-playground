import { createContext, useContext } from "react"

export type SPAnalysisDataModel = {
    title: string
    setTitle: (title: string) => void
    stanFileContent: string
    setStanFileContent: (text: string) => void
    // in future, we may also want to track the compilation state for this stan file content
    dataFileContent: string
    setDataFileContent: (text: string) => void
    samplingOptsContent: string
    setSamplingOptsContent: (text: string) => void

    clearAll: () => void
}

type SPAnalysisContextType = {
    localDataModel: SPAnalysisDataModel
}

export const SPAnalysisContext = createContext<SPAnalysisContextType | undefined>(undefined)

export const useSPAnalysis = () => {
    const context = useContext(SPAnalysisContext)
    if (context === undefined) {
        throw new Error("useSPAnalysis must be used within a SPAnalysisProvider")
    }
    return context
}