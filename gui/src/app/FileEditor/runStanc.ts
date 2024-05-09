/* eslint-disable @typescript-eslint/no-explicit-any */
const runStanc = async (name: string, stanText: string, args: any) => {
    const timer = Date.now();
    while (!(window as any).stanc) {
        const elapsed = Date.now() - timer;
        if (elapsed > 3000) {
            throw new Error("stanc not loaded");
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return (window as any).stanc(name, stanText, args)
}

export default runStanc