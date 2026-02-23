import {
  initialDataModel,
  modelHasUnsavedChanges,
  ProjectDataModel,
} from "@SpCore/Project/ProjectDataModel";
import {
  fetchRemoteProject,
  fromQueryParams,
  queryStringHasParameters,
} from "@SpCore/Project/ProjectQueryLoading";
import ProjectReducer, {
  ProjectReducerAction,
} from "@SpCore/Project/ProjectReducer";
import {
  deserializeProjectFromString,
  serializeProjectToString,
} from "@SpCore/Project/ProjectSerialization";
import {
  createContext,
  FunctionComponent,
  PropsWithChildren,
  useEffect,
  useReducer,
} from "react";
import { useSearchParams } from "react-router";

type ProjectContextType = {
  data: ProjectDataModel;
  update: React.Dispatch<ProjectReducerAction>;
};

type ProjectContextProviderProps = {
  persist?: boolean;
};

export const ProjectContext = createContext<ProjectContextType>({
  data: initialDataModel,
  update: () => {},
});

const ProjectContextProvider: FunctionComponent<
  PropsWithChildren<ProjectContextProviderProps>
> = ({ children, persist = true }) => {
  const [data, update] = useReducer(ProjectReducer, initialDataModel);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    // as user reloads the page or closes the tab, save state to local storage
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (persist) {
        const state = serializeProjectToString(data);
        localStorage.setItem("stan-playground-saved-state", state);
        if (modelHasUnsavedChanges(data)) {
          e.preventDefault();
          e.returnValue = true; // legacy
        }
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [data, persist]);

  useEffect(() => {
    const queries = fromQueryParams(searchParams);
    if (queryStringHasParameters(queries)) {
      fetchRemoteProject(queries).then((data) => {
        update({ type: "loadInitialData", state: data });

        // set title so that history is better preserved in the browser
        document.title = "Stan Playground - " + data.meta.title;
        // clear search parameters now that load is complete
        // this creates a new history entry
        setSearchParams(new URLSearchParams());
        // set the title again, making it clearer that this entry is not
        // the one loaded from the query parameters
        document.title = "Stan Playground - Editing " + data.meta.title;
      });
    } else {
      // load the saved state on first load
      if (persist) {
        const savedState = localStorage.getItem("stan-playground-saved-state");
        if (!savedState) return;
        const parsedData = deserializeProjectFromString(savedState);
        if (!parsedData) return; // unsuccessful parse or type cast
        update({ type: "loadInitialData", state: parsedData });
      }
    }
    // once we have loaded some data, we don't need the localStorage again
    // and it will be overwritten by the above event listener on close
    localStorage.removeItem("stan-playground-saved-state");
  }, [searchParams, setSearchParams, persist]);

  return <ProjectContext value={{ data, update }}>{children}</ProjectContext>;
};

export default ProjectContextProvider;
