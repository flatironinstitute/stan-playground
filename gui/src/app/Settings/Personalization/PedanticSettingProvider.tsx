import {
  createContext,
  FunctionComponent,
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from "react";

export const PedanticContext = createContext({
  togglePedantic: () => {},
  pedantic: false,
});

const storedPedanticSetting = localStorage.getItem("pedantic") as
  | "true"
  | "false"
  | null;

const PedanticSettingProvider: FunctionComponent<PropsWithChildren> = ({
  children,
}) => {
  const defaultSetting = useMemo(() => {
    if (storedPedanticSetting === "true") {
      return true;
    }

    return false;
  }, []);

  const [pedantic, setMode] = useState<boolean>(defaultSetting);

  const togglePedantic = useCallback(() => {
    setMode((prev) => {
      const newSetting = !prev;
      localStorage.setItem("pedantic", newSetting.toString());
      return newSetting;
    });
  }, []);

  return (
    <PedanticContext.Provider value={{ togglePedantic, pedantic }}>
      {children}
    </PedanticContext.Provider>
  );
};

export default PedanticSettingProvider;
