import { cleanProtectedCode } from "src/content/questions/CodeQuestion";
import { Interpreter } from "src/interpreter";
import { ConfirmToast, Toast } from "src/utils/popup";

export type EvalResponse = string | { error: string };

let interpreter: Interpreter | undefined = undefined;

async function loadEruda() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("dbg")) return;

  const { default: eruda } = await import("eruda");
  eruda.init();
  eruda.show();
  const console = eruda.get("console");
  window.console = console;
  console.config.set("catchGlobalErr", true);

  console.log("Loaded Eruda");
}

(async () => {
  const toast = async () =>
    ConfirmToast({
      title: "Download Rust Interpreter",
      html: "Do you want to download the Rust interpreter in the background? (40MB)<br><br>Code Blocks will run much faster and be unaffected by your internet connection.",
      confirmButtonText: "Yes!",
      denyButtonText: "Nope",
    }).then((t) => t.isConfirmed);

  await loadEruda();

  console.log("Loading Interpreter");

  const hasSaidOk = localStorage.getItem("interpreter-download");
  const showMessage = !sessionStorage.getItem("interpreter-message-shown");

  if (hasSaidOk || (await toast())) {
    localStorage.setItem("interpreter-download", "true");
    interpreter = new Interpreter();
    interpreter.onAssetDownloaded((a) => {
      console.log(`Downloaded "${a}"`);
      showMessage && Toast({ text: `Downloaded "${a}"`, timer: 1000 });
    });
    interpreter.onLoaded(() => {
      sessionStorage.setItem("interpreter-message-shown", "true");
      console.log("Interpreter loaded!");
      showMessage &&
        Toast({
          title: `Interpreter ${hasSaidOk ? "loaded" : "downloaded"} successfully!`,
          timer: 3000,
        });
    });
  }
})();

export async function evaluate(code: string, error: string): Promise<EvalResponse> {
  code = cleanProtectedCode(code);
  if (interpreter?.isLoaded()) {
    return interpreter.runAsync(code);
  }
  return Promise.race([
    godbolt(code, error).catch(() => playground(code, error)),
    new Promise<EvalResponse>((resolve, _) =>
      setTimeout(() => resolve(err("Execution timed out, please try again.")), 5000),
    ),
  ]).catch(() => err("There was an error during execution, please try again."));
}

async function godbolt(code: string, error: string): Promise<EvalResponse> {
  const params = {
    source: code,
    bypassCache: 0,
    compiler: "nightly",
    options: {
      userArguments: "",
      executeParameters: {
        args: "",
        stdin: "",
        runtimeTools: [],
      },
      compilerOptions: {
        executorRequest: false,
        skipAsm: true,
        overrides: [
          {
            name: "edition",
            value: "2021",
          },
        ],
      },
      filters: {
        execute: true,
        commentOnly: true,
        trim: true,
        directives: true,
        labels: true,
      },
      tools: [],
      libraries: [],
    },
    lang: "rust",
    files: [],
    allowStoreCodeDebug: true,
  };

  const response = await fetch("https://godbolt.org/api/compiler/nightly/compile", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    mode: "cors",
    body: JSON.stringify(params),
  }).then((r) => r.text());
  console.log({ params, response });

  const execution = response.indexOf("# Exec");
  const stdout_idx = response.indexOf("# Standard out:", execution);

  if (stdout_idx !== -1) {
    return response.substring(stdout_idx + " Standard out:\n".length + 1);
  }

  const compilation = response.indexOf("# Compiler");
  const stderr_idx = response.indexOf("\nStandard error:", compilation);
  if (stderr_idx !== -1) {
    return err(error || response.substring(stderr_idx + "Standard error:\n".length + 1));
  }

  return "";
}

async function playground(code: string, error: string): Promise<EvalResponse> {
  const params = {
    version: "stable",
    optimize: "0",
    code,
    edition: "2021",
  };

  return fetch("https://play.rust-lang.org/evaluate.json", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    mode: "cors",
    body: JSON.stringify(params),
  })
    .then((response) => response.json())
    .then((response) => {
      console.log({ params, response });
      return response;
    })
    .then((response) => (response.error === null ? response.result : err(error || response.error)))
    .catch((error) => err(error || error.message));
}

function err(error: string): EvalResponse {
  return { error };
}
