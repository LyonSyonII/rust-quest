import type { CodeQuestion } from "./CodeQuestion";

export const question: CodeQuestion = {
  code: "",
  setup: "__VALUE__",
  vars: [
    {
      v: "NAME",
      d: "Hero",
      c: (v) => v[0] || "H",
    },
  ],
  validator: (_value: string, test: (regex: RegExp) => boolean) =>
    (test(/something/) && "ERROR") || undefined,
  onsuccess: (_stdout: string, _value: string) => {},
};
