import { useReducer } from 'react'
import { BrowserRouter } from 'react-router-dom'
import MainWindow from './MainWindow'
import SPAnalysisContextProvider from './SPAnalysis/SPAnalysisContextProvider'
import { CustomStatusBarElementsContext, customStatusBarElementsReducer } from './StatusBar'

function App() {
  const [customStatusBarStrings, customStatusBarStringsDispatch] = useReducer(customStatusBarElementsReducer, {})
  return (
    <BrowserRouter>
        <CustomStatusBarElementsContext.Provider value={{customStatusBarElements: customStatusBarStrings, customStatusBarElementsDispatch: customStatusBarStringsDispatch}}>
          <SPAnalysisContextProvider sourceDataUri="unused">
            <MainWindow />
          </SPAnalysisContextProvider>
        </CustomStatusBarElementsContext.Provider>
    </BrowserRouter>
  )
}

export default App
