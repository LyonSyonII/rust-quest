import {
  stringifyStore as getCheckpoints,
  parseStore as setCheckpoints,
} from "@components/Checkpoint/checkpoint";
import {
  stringifyStore as getUserCodes,
  parseStore as setUserCodes,
} from "@components/CodeBlock/persistence";
import { compressToUint8Array, decompressFromUint8Array } from "lz-string";

type SaveData = {
  checkpoints: string;
  userCodes: string;
  localStorage: string;
};

export async function importDataFromFile() {
  const input = document.createElement("input");
  input.type = "file";

  input.addEventListener("change", async function () {
    if (!this.files) return;

    const file = this.files[0];
    const data = new Uint8Array(await file.arrayBuffer());
    importData(data);

    input.remove();
  });

  input.click();
}

export async function exportDataToFile() {
  const compressed = await exportData();
  const blob = new Blob([compressed]);
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = "RustQuest.sav";
  link.click();
}

export async function importData(data: Uint8Array) {
  const json = decompressFromUint8Array(data);
  const save: SaveData = JSON.parse(json);
  const local: Storage = JSON.parse(save.localStorage);

  Promise.allSettled([
    setCheckpoints(save.checkpoints),
    setUserCodes(save.userCodes),
  ]);
  for (const [key, value] of Object.entries(local)) {
    localStorage.setItem(key, value);
  }
  location.reload();
}

export async function exportData(): Promise<Uint8Array> {
  const [checkpoints, userCodes] = await Promise.all([
    getCheckpoints(),
    getUserCodes(),
  ]);
  const save: SaveData = {
    checkpoints,
    userCodes,
    localStorage: JSON.stringify(localStorage),
  };
  const json = JSON.stringify(save);
  return compressToUint8Array(json);
}
