import * as idb from "idb-keyval";

const store = idb.createStore("rustquest-usercode", "rustquest-usercode-store");

export async function get(key: string): Promise<string | undefined> {
  return idb.get<string>(key, store);
}

export async function set(key: string, value: string) {
  return idb.set(key, value, store);
}

export async function stringifyStore(): Promise<string> {
  return JSON.stringify(await idb.entries(store));
}

/** Parses a specified JSON, sets the store to the parsed values and returns it. */
export async function parseStore(
  json: string,
): Promise<[IDBValidKey, string][]> {
  const entries = JSON.parse(json) as [IDBValidKey, string][];
  await idb.setMany(entries, store);
  return entries;
}
