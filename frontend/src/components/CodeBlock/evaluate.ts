import { translation } from "@i18n/_CodeBlock";
import type { Langs } from "@i18n/_langs";

export async function evaluate(
  code: string,
  lang: Langs,
  errorMsg?: string,
): Promise<string> {
  const error = errorMsg || translation(lang).error;

  if (import.meta.env.MODE.includes("dev")) {
    return Promise.race([
      godbolt(code, error),
      playground(code, error) /* , server(code, error) */,
    ]);
  }

  return Promise.race([
    // server(code, error),
    godbolt(code, error),
    playground(code, error),
    new Promise((resolve, _) =>
      setTimeout(() => resolve("Execution timed out, please try again."), 3000),
    ) as Promise<string>,
  ]).catch(() => "There was an error, please try again.");
}

async function godbolt(code: string, error: string): Promise<string> {
  const params = {
    source: code,
    bypassCache: 2,
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

  const response = await fetch(
    "https://godbolt.org/api/compiler/nightly/compile",
    {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      mode: "cors",
      body: JSON.stringify(params),
    },
  ).then((r) => r.text());
  console.log({ params, response });

  const execution = response.indexOf("# Exec");
  const stdout_idx = response.indexOf("# Standard out:", execution);

  if (stdout_idx !== -1) {
    return response.substring(stdout_idx + " Standard out:\n".length + 1);
  }

  const compilation = response.indexOf("# Compiler");
  const stderr_idx = response.indexOf("\nStandard error:", compilation);
  console.log({ compilation, stderr_idx });
  if (stderr_idx !== -1) {
    return (
      error || response.substring(stderr_idx + "Standard error:\n".length + 1)
    );
  }

  return "UNKNOWN ERROR";
}

async function playground(code: string, error: string): Promise<string> {
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
    .then((response) => {
      if (response.error === null) {
        return response.result;
      } else {
        return error || response.error;
      }
    })
    .catch((error) => error || error.message);
}
