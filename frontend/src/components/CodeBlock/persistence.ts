import * as idb from "idb-keyval";

const store = idb.createStore("rustquest-usercode", "rustquest-usercode-store");

export async function get(key: string): Promise<string | undefined> {
  return idb.get<string>(key, store);
}

export async function set(key: string, value: string) {
  return idb.set(key, value, store);
}

export async function stringifyStore(): Promise<string> {
  return JSON.stringify(await idb.entries<string, string>(store));
}

export type CodeStore = [key: IDBValidKey, value: string][];
export async function getSerializableStore(): Promise<CodeStore> {
  return (await idb.entries<string, string>(store));
}

/** Parses a specified JSON, sets the store to the parsed values and returns it. */
export async function parseStore(
  entries: CodeStore,
) {
  await idb.setMany(entries, store);
}
