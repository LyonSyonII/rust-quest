import { type Langs, translation } from "@i18n/CodeBlock";

export async function evaluate(
  code: string,
  lang: Langs,
  errorMsg?: string,
): Promise<string> {
  const error = errorMsg || translation(lang).error;

  return Promise.race([
    server(code, error),
    playground(code, error),
    new Promise((_, reject) =>
      setTimeout(() => reject("TIMEOUT"), 2000),
    ) as Promise<string>,
  ]);
}

async function server(code: string, error: string): Promise<string> {
  const params = {
    code,
  };

  // TODO: Auth env var is not possible in the browser
  return fetch("https://rust-quest.garriga.dev/evaluate.json", {
    headers: {
      "Content-Type": "application/json",
      // "authorization": auth || "",
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
      if (response.ok) {
        return response.ok.stdout;
      } else {
        return error || response.err.stderr;
      }
    })
    .catch((error) => error || error.message);
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
