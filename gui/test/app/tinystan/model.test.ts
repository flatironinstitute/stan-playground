import { describe, expect, test } from 'vitest';
import { getMockedModel } from './mocking/WASMModule';


describe("test tinystan code with a mocked WASM module", () => {

    test("version returns and doesn't leak", async () => {
        const { mockedModule, model } = await getMockedModel({});
        const v = model.stanVersion();

        expect(v).toEqual("123.123.123");
        expect(mockedModule._tinystan_stan_version).toHaveBeenCalledTimes(1);
        expect(mockedModule).toHaveNoMemoryLeaks();
    })

    test("null sample call doesn't leak", async () => {
        const { mockedModule, model } = await getMockedModel({});
        model.sample({});

        expect(mockedModule._tinystan_sample).toHaveBeenCalledTimes(1);
        expect(mockedModule).toHaveNoMemoryLeaks();
    })

    test("erroring sample call doesn't leak", async () => {
        const { mockedModule, model } = await getMockedModel({ returnCode: 1 });
        expect(() => model.sample({})).toThrow("Error at address 999");

        expect(mockedModule._tinystan_sample).toHaveBeenCalledTimes(1);
        expect(mockedModule).toHaveNoMemoryLeaks();
    });

    test("sampling an empty model errors and doesn't leak", async () => {
        const { mockedModule, model } = await getMockedModel({ numParams: 0 });
        expect(() => model.sample({})).toThrow(/no parameters/);

        expect(mockedModule._tinystan_sample).toHaveBeenCalledTimes(0);
        expect(mockedModule).toHaveNoMemoryLeaks();
    });

    test("null pathfinder call doesn't leak", async () => {
        const { mockedModule, model } = await getMockedModel({});
        model.pathfinder({});

        expect(mockedModule._tinystan_pathfinder).toHaveBeenCalledTimes(1);
        expect(mockedModule).toHaveNoMemoryLeaks();
    })

    test("erroring pathfinder call doesn't leak", async () => {
        const { mockedModule, model } = await getMockedModel({ returnCode: 1 });
        expect(() => model.pathfinder({})).toThrow("Error at address 999");

        expect(mockedModule._tinystan_pathfinder).toHaveBeenCalledTimes(1);
        expect(mockedModule).toHaveNoMemoryLeaks();
    });

    test("pathfinding an empty model errors and doesn't leak", async () => {
        const { mockedModule, model } = await getMockedModel({ numParams: 0 });
        expect(() => model.pathfinder({})).toThrow(/no parameters/);

        expect(mockedModule._tinystan_pathfinder).toHaveBeenCalledTimes(0);
        expect(mockedModule).toHaveNoMemoryLeaks();
    });

});
