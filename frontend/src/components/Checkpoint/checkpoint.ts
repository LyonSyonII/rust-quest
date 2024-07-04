import * as idb from "idb-keyval";

const store = idb.createStore("rustquest-checkpoints", "rustquest-checkpoints-store");

export async function add(id: string) {
  const level = getLevel(id);
  
  await idb.update<Set<string>>(level, (v) => {
    if (!v) {
      v = new Set();
    }
    v.add(id);
    console.log("updated", {v});
    return v;
  }, store);
  await callSubscribed(level);
}

export async function remove(id: string) {
  const level = getLevel(id);
  await idb.update<Set<string>>(level, (v) => {
    if (!v) {
      v = new Set();
    }
    v.delete(id);
    v.delete(`${level}-confetti`);
    return v;
  }, store);
  await callSubscribed(level);
}

export async function removeAll(level: string) {
  await idb.update<Set<string>>(level, () => {
    return new Set();
  }, store);
  await callSubscribed(level);
}

export function subscribe(id: string, run: (checkpoints: Set<string>) => Promise<void>, runOnSubscribed: boolean = false) {
  const level = getLevel(id);
  let events = subscribed.get(level);
  if (events === undefined) {
    events = [];
  }
  events.push(run);
  subscribed.set(level, events);
  runOnSubscribed && callSubscribed(level);
}

const subscribed: Map<string, ((checkpoints: Set<string>) => Promise<void>)[]> = new Map();

async function callSubscribed(level: string) {
  const events = subscribed.get(level);
  if (!events) return;
  
  const checkpoints: Set<string> = await idb.get(level, store) || new Set();
  await Promise.allSettled(events.map(e => e(checkpoints)));
}

function getLevel(id: string): string {
  const level = id.split("-")[0];
  if (!level) {
    throw `Invalid id: ${id}`;
  }
  return level;
}