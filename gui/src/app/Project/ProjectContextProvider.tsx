import { initialDataModel, ProjectDataModel } from "./ProjectDataModel";
import {
  createContext,
  FunctionComponent,
  PropsWithChildren,
  useEffect,
  useReducer,
} from "react";
import {
  ProjectReducer,
  ProjectReducerAction,
  ProjectReducerType,
} from "./ProjectReducer";
import {
  deserializeProjectFromLocalStorage,
  serializeProjectToLocalStorage,
} from "./ProjectSerialization";
import {
  fetchRemoteProject,
  queryStringHasParameters,
  fromQueryParams,
} from "./ProjectQueryLoading";
import { useSearchParams } from "react-router-dom";

type ProjectContextType = {
  data: ProjectDataModel;
  update: React.Dispatch<ProjectReducerAction>;
};

type ProjectContextProviderProps = {
  //
};

export const ProjectContext = createContext<ProjectContextType>({
  data: initialDataModel,
  update: () => {},
});

const ProjectContextProvider: FunctionComponent<
  PropsWithChildren<ProjectContextProviderProps>
> = ({ children }) => {
  const [data, update] = useReducer<ProjectReducerType>(
    ProjectReducer,
    initialDataModel,
  );

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    // as user reloads the page or closes the tab, save state to local storage
    const handleBeforeUnload = () => {
      const state = serializeProjectToLocalStorage(data);
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
      fetchRemoteProject(queries).then((data) => {
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
      const parsedData = deserializeProjectFromLocalStorage(savedState);
      if (!parsedData) return; // unsuccessful parse or type cast
      update({ type: "loadInitialData", state: parsedData });
    }
    // once we have loaded some data, we don't need the localStorage again
    // and it will be overwritten by the above event listener on close
    localStorage.removeItem("stan-playground-saved-state");
  }, [searchParams, setSearchParams]);

  return (
    <ProjectContext.Provider value={{ data, update }}>
      {children}
    </ProjectContext.Provider>
  );
};

export default ProjectContextProvider;
