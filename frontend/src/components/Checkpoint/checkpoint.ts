type Checkpoints = Map<string, Set<string>>;

// TODO: Change to indexed db

class Persistent {
  persistent: Checkpoints = new Map();
  subscribers: Array<(checkpoints: Checkpoints) => void> = [];

  constructor() {
    this.persistent = this.deserialize();
  }

  private serialize() {
    const serialized: Array<[string, string[]]> = [
      ...this.persistent.entries(),
    ].map(([k, v]) => [k, Array.from(v)]);
    localStorage.setItem("checkpoints", JSON.stringify(serialized));
  }

  /* Old format
    {"data":[["#$@__reference__1","1",{"data":["1-1"],"#$@__constructor__":"Set","#$@__reference__":2}],["#$@__reference__3","2",{"data":["2-1","2-2","2-3","2-4","2-5","2-6","2-7","2-8","2-confetti"],"#$@__constructor__":"Set","#$@__reference__":4}],["#$@__reference__5","3",{"data":["3-1"],"#$@__constructor__":"Set","#$@__reference__":6}],["#$@__reference__7","4",{"data":["4-1"],"#$@__constructor__":"Set","#$@__reference__":8}]],"#$@__constructor__":"Map","#$@__reference__":0} 
  */
  private deserialize(): Checkpoints {
    const item = localStorage.getItem("checkpoints") as string;
    const parsed: Array<[string, string[]]> = (item && JSON.parse(item)) || [];
    if (!Array.isArray(parsed)) {
      window.alert("Failed to load checkpoints, resetting progress.");
      return new Map();
    }
    return new Map(parsed.map(([k, v]) => [k, new Set(v)]));
  }

  update(callback: (checkpoints: Checkpoints) => Checkpoints) {
    this.persistent = callback(this.persistent);
    this.serialize();
    this.subscribers.forEach((subscriber) => subscriber(this.persistent));
  }

  subscribe(callback: (checkpoints: Checkpoints) => void) {
    this.subscribers.push(callback);
    callback(this.persistent);
  }
}

const persistentCheckpoints = new Persistent();

export function add(id: string) {
  const k = id.split("-")[0];
  if (k === undefined) {
    throw "Invalid id";
  }

  persistentCheckpoints.update((checkpoints) => {
    const checkpoint = checkpoints.get(k);
    if (checkpoint === undefined) {
      checkpoints.set(k, new Set([id]));
    } else {
      checkpoint.add(id);
    }
    return checkpoints;
  });
}

export function subscribe(id: string, run: (checkpoint: Set<string>) => void) {
  const k = id.split("-")[0];
  if (k === undefined) {
    throw "Invalid id";
  }
  persistentCheckpoints.update(
    (checkpoints) =>
      (!checkpoints.has(k) && checkpoints.set(k, new Set([]))) || checkpoints,
  );
  persistentCheckpoints.subscribe((checkpoints) => {
    run(checkpoints.get(k) as Set<string>);
  });
}

export function remove(id: string) {
  const k = id.split("-")[0];
  if (k === undefined) {
    throw "Invalid id";
  }
  persistentCheckpoints.update((checkpoints) => {
    checkpoints.delete(k);
    return checkpoints;
  });
}
