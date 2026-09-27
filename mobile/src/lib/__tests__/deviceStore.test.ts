import * as SecureStore from "expo-secure-store";
import { deviceStore } from "../deviceStore";

jest.mock("expo-secure-store", () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(() => Promise.resolve()) }));

const getItem = SecureStore.getItemAsync as jest.Mock;
const setItem = SecureStore.setItemAsync as jest.Mock;

beforeEach(() => {
  getItem.mockReset();
  setItem.mockClear();
});

describe("deviceStore", () => {
  it("loads the stored value for the account", async () => {
    getItem.mockResolvedValue(JSON.stringify(["a"]));
    const store = deviceStore<string[]>("test", []);
    await store.select("u1");
    expect(store.get()).toEqual({ userId: "u1", value: ["a"], loaded: true });
    expect(getItem).toHaveBeenCalledWith("ucompass.test.u1");
  });

  it("keeps a change made while loading, on top of what's stored", async () => {
    let resolve!: (raw: string) => void;
    getItem.mockReturnValue(new Promise((r) => (resolve = r)));
    const store = deviceStore<string[]>("test", []);
    const loading = store.select("u1");
    store.update((v) => [...v, "new"]);
    expect(store.get().value).toEqual(["new"]);
    expect(setItem).not.toHaveBeenCalled();
    resolve(JSON.stringify(["old"]));
    await loading;
    expect(store.get().value).toEqual(["old", "new"]);
    expect(setItem).toHaveBeenCalledWith("ucompass.test.u1", JSON.stringify(["old", "new"]));
  });

  it("saves changes once loaded", async () => {
    getItem.mockResolvedValue(null);
    const store = deviceStore<string[]>("test", []);
    await store.select("u1", ["from profile"]);
    expect(store.get().value).toEqual(["from profile"]);
    store.update((v) => [...v, "x"]);
    expect(setItem).toHaveBeenCalledWith("ucompass.test.u1", JSON.stringify(["from profile", "x"]));
  });

  it("ignores changes while signed out", () => {
    const store = deviceStore<string[]>("test", []);
    store.update((v) => [...v, "x"]);
    expect(store.get()).toEqual({ userId: null, value: [], loaded: false });
    expect(setItem).not.toHaveBeenCalled();
  });

  it("drops a slow load for an account you've since left", async () => {
    let resolve!: (raw: string) => void;
    getItem.mockReturnValueOnce(new Promise((r) => (resolve = r))).mockResolvedValueOnce(JSON.stringify(["b"]));
    const store = deviceStore<string[]>("test", []);
    const first = store.select("u1");
    await store.select("u2");
    resolve(JSON.stringify(["a"]));
    await first;
    expect(store.get()).toEqual({ userId: "u2", value: ["b"], loaded: true });
  });
});
