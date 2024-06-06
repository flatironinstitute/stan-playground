import { createContext, useContext } from "react"

export type SPAnalysisDataModel = {
    title: string
    stanFileContent: string
    setStanFileContent: (text: string) => void
    dataFileContent: string
    setDataFileContent: (text: string) => void
    samplingOptsContent: string
    setSamplingOptsContent: (text: string) => void
}

type SPAnalysisContextType = {
    sourceAnalysisFiles: {[key: string]: string}
    localAnalysisFiles: {[key: string]: string}
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