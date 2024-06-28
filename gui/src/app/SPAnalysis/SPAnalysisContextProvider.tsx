import { initialDataModel, SPAnalysisDataModel } from "./SPAnalysisDataModel";
import {
  createContext,
  FunctionComponent,
  PropsWithChildren,
  useEffect,
  useReducer,
} from "react";
import {
  SPAnalysisReducer,
  SPAnalysisReducerAction,
  SPAnalysisReducerType,
} from "./SPAnalysisReducer";
import {
  deserializeAnalysisFromLocalStorage,
  serializeAnalysisToLocalStorage,
} from "./SPAnalysisSerialization";
import {
  fetchRemoteAnalysis,
  queryStringHasParameters,
  fromQueryParams,
} from "./SPAnalysisQueryLoading";
import { useSearchParams } from "react-router-dom";

type SPAnalysisContextType = {
  data: SPAnalysisDataModel;
  update: React.Dispatch<SPAnalysisReducerAction>;
};

type SPAnalysisContextProviderProps = {
  //
};

export const SPAnalysisContext = createContext<SPAnalysisContextType>({
  data: initialDataModel,
  update: () => {},
});

const SPAnalysisContextProvider: FunctionComponent<
  PropsWithChildren<SPAnalysisContextProviderProps>
> = ({ children }) => {
  const [data, update] = useReducer<SPAnalysisReducerType>(
    SPAnalysisReducer,
    initialDataModel,
  );

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    // as user reloads the page or closes the tab, save state to local storage
    const handleBeforeUnload = () => {
      const state = serializeAnalysisToLocalStorage(data);
      localStorage.setItem("stan-playground-saved-state", state);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [data]);

  useEffect(() => {
    const queries = fromQueryParams(searchParams);
    if (queryStringHasParameters(queries)) {
      fetchRemoteAnalysis(queries).then((data) => {
        update({ type: "loadInitialData", state: data });

        // set title so that history is better preserved in the browser
        document.title = "Stan Playground - " + data.meta.title;
        // clear search parameters now that load is complete
        setSearchParams(new URLSearchParams());
      });
    } else {
      // load the saved state on first load
      const savedState = localStorage.getItem("stan-playground-saved-state");
      if (!savedState) return;
      const parsedData = deserializeAnalysisFromLocalStorage(savedState);
      if (!parsedData) return; // unsuccessful parse or type cast
      update({ type: "loadInitialData", state: parsedData });
    }
    // once we have loaded some data, we don't need the localStorage again
    // and it will be overwritten by the above event listener on close
    localStorage.removeItem("stan-playground-saved-state");
  }, [searchParams, setSearchParams]);

  return (
    <SPAnalysisContext.Provider value={{ data, update }}>
      {children}
    </SPAnalysisContext.Provider>
  );
};

export default SPAnalysisContextProvider;
