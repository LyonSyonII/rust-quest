import {
  stringifyStore as getCheckpoints,
  parseStore as setCheckpoints,
} from "@components/Checkpoint/checkpoint";
import {
  stringifyStore as getUserCodes,
  parseStore as setUserCodes,
} from "@components/CodeBlock/persistence";
import { compressToUint8Array, decompressFromUint8Array } from "lz-string";
import Swal from "sweetalert2";

type SaveData = {
  checkpoints: string;
  userCodes: string;
  localStorage: string;
};

export async function importDataFromServer() {}

export async function exportDataToServer() {
  const user_prompt = await Swal.fire<string>({
    title: "Enter your username",
    html: "Will be used as the identifier for your save.<br>Think of something unique, or someone else could access your saves!",
    input: "text",
    showCancelButton: true,
    confirmButtonText: "Save",
    showLoaderOnConfirm: true,
    preConfirm: async (name: string) => {
      if (name.length === 0) {
        return Swal.showValidationMessage("The name cannot be empty.");
      }
      if (name.match(/\s/g)) {
        return Swal.showValidationMessage("The name cannot contain spaces.");
      }
      if (name.match(/[;\/\\]/g)) {
        return Swal.showValidationMessage(
          "The name cannot contain any of: <code>;/\\</code>",
        );
      }
    },
  });
  if (user_prompt.isDismissed || !user_prompt.value) {
    return;
  }

  const fire_error = (text: string) =>
    Swal.fire({ title: "Error saving", icon: "error", text }).then(
      () => undefined,
    );

  const params = new URLSearchParams({ name: user_prompt.value });
  const request = await fetch(`http://localhost:9571?${params}`, {
    method: "POST",
    mode: "cors",
    body: await exportData(),
  }).catch((e) => fire_error(e));
  if (!request) {
    return;
  }
  if (request.ok) {
    Swal.fire({ title: "Saved progress successfully!", icon: "success" });
  } else {
    fire_error(request?.statusText);
  }
}

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
