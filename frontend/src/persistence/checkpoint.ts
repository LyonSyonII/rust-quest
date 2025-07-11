import * as idb from "idb-keyval";

const store = idb.createStore("rustquest-checkpoints", "rustquest-checkpoints-store");

export async function add(id: string) {
  const level = getLevel(id);

  await idb.update<Set<string>>(
    level,
    (v = new Set()) => {
      v.add(id);
      return v;
    },
    store,
  );
  await callSubscribed(level);
}

export async function remove(id: string) {
  const level = getLevel(id);
  await idb.update<Set<string>>(
    level,
    (v = new Set()) => {
      v.delete(id);
      v.delete(`${level}-completed`);
      return v;
    },
    store,
  );
  await callSubscribed(level);
}

export async function removeAll(level: string) {
  await idb.update<Set<string>>(level, () => new Set(), store);
  await callSubscribed(level);
}

export function subscribe(
  id: string,
  run: (checkpoints: Set<string>) => Promise<void>,
  runOnSubscribed = false,
) {
  const level = getLevel(id);
  let events = subscribed.get(level);
  if (events === undefined) {
    events = [];
  }
  events.push(run);
  subscribed.set(level, events);
  runOnSubscribed && callSubscribed(level);
}

export async function getAll() {
  return idb.entries(store);
}

export async function stringifyStore(): Promise<string> {
  const entries = (await idb.entries(store)).map(([k, v]: [IDBValidKey, Set<string>]) => [
    k,
    JSON.stringify([...v.values()]),
  ]);
  return JSON.stringify(entries);
}

export type CheckpointStore = [key: IDBValidKey, value: string[]][];
export async function getSerializableStore(): Promise<CheckpointStore> {
  const entries = await idb.entries<IDBValidKey, Set<string>>(store);
  return entries.map(([k, v]) => [k, [...v.values()]]);
}

/** Parses a specified JSON, sets the store to the parsed values and returns it. */
export async function parseStore(checkpoints: CheckpointStore) {
  const entries: [IDBValidKey, Set<string>][] = checkpoints.map(([k, v]) => [k, new Set(v)]);
  await idb.setMany(entries, store);
}

const subscribed: Map<string, ((checkpoints: Set<string>) => Promise<void>)[]> = new Map();

async function callSubscribed(level: string) {
  const events = subscribed.get(level);
  if (!events) return;

  const checkpoints: Set<string> = (await idb.get(level, store)) || new Set();
  await Promise.allSettled(events.map((e) => e(checkpoints)));
}

function getLevel(id: string): string {
  const level = id.split("-")[0];
  if (!level) {
    throw `Invalid id: ${id}`;
  }
  return level;
}
