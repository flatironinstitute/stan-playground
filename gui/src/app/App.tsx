import { useReducer } from 'react'
import { BrowserRouter } from 'react-router-dom'
import MainWindow from './MainWindow'
import { CustomStatusBarElementsContext, customStatusBarElementsReducer } from './StatusBar'

function App() {
  const [customStatusBarStrings, customStatusBarStringsDispatch] = useReducer(customStatusBarElementsReducer, {})
  return (
    <BrowserRouter>
        <CustomStatusBarElementsContext.Provider value={{customStatusBarElements: customStatusBarStrings, customStatusBarElementsDispatch: customStatusBarStringsDispatch}}>
          <MainWindow />
        </CustomStatusBarElementsContext.Provider>
    </BrowserRouter>
  )
}

export default App
