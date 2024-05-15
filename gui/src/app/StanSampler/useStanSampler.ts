import { useEffect, useState } from "react";
import StanSampler from "./StanSampler";

const useStanSampler = (compiledMainJsUrl: string | undefined) => {
    const [sampler, setSampler] = useState<StanSampler | undefined>(undefined);
    useEffect(() => {
        if (!compiledMainJsUrl) {
            setSampler(undefined);
            return;
        }
        const s = new StanSampler(compiledMainJsUrl);
        setSampler(s);
        return () => {
            s.terminate();
        }
    }, [compiledMainJsUrl])

    return {sampler}
}

export default useStanSampler;