import * as idb from "idb-keyval";

const store = idb.createStore("rustquest-usercode", "rustquest-usercode-store");

export async function get(key: string): Promise<string | undefined> {
  return idb.get<string>(key, store);
}

export async function set(key: string, value: string) {
  return idb.set(key, value, store);
}
