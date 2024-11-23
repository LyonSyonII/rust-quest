import {
  getSerializableStore as getCheckpoints,
  parseStore as setCheckpoints,
  type CheckpointStore,
} from "@components/Checkpoint/checkpoint";
import {
  getSerializableStore as getUserCodes,
  parseStore as setUserCodes,
  type CodeStore,
} from "@components/CodeBlock/persistence";
import { compressToEncodedURIComponent, compressToUint8Array, decompressFromUint8Array } from "lz-string";

type SaveData = {
  checkpoints: CheckpointStore;
  userCodes: CodeStore;
  local: Storage;
};

export async function importDataFromFile() {
  const input = document.createElement("input");
  input.type = "file";

  input.addEventListener("change", async function () {
    if (!this.files) return;

    const file = this.files[0];
    const data = new Uint8Array(await file.arrayBuffer());
    importData(decompressFromUint8Array(data));
    
    input.remove();
  });

  input.click();
}

export async function exportDataToFile() {
  const data = await exportData();
  const blob = new Blob([compressToUint8Array(data)]);
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = "RustQuest.sav";
  link.click();
}

export async function exportDataToURI() {
  const data = await exportData();
  const uri = compressToEncodedURIComponent(data);
  const url = new URL(document.URL);
  url.searchParams.set("save", uri);
  window.history.pushState(null, "", url.toString());
}

export async function importData(json: string) {
  const {checkpoints, userCodes, local}: SaveData = JSON.parse(json);

  Promise.allSettled([
    setCheckpoints(checkpoints), 
    setUserCodes(userCodes),
  ]);
  for (const [key, value] of Object.entries(local)) {
    localStorage.setItem(key, value);
  }
  location.reload();
}

export async function exportData(): Promise<string> {
  const [checkpoints, userCodes] = await Promise.all([
    getCheckpoints(),
    getUserCodes(),
  ]);
  const save: SaveData = { checkpoints, userCodes, local: localStorage };
  const json = JSON.stringify(save);
  return json;
}
