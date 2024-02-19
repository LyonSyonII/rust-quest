import type { CodeQuestion } from "./CodeQuestion";

const question: CodeQuestion = {
  /** Invisible part of the code.
   *
   *  All instances of `__VALUE__` will be replaced with the current editor value. */
  setup: "__VALUE__",
  vars: [
    {
      /** Name of the variable. */
      v: "NAME",
      /** Default value if variable does not exist. */
      d: "Hero",
      /** Transform the variable's value before replacing it. */
      c: (v) => v[0] || "H",
    },
  ],
  /** Function to validate the code entered by the user.
   *
   *  If it returns `Some`, it will be displayed in the output and the code will not be executed. */
  validator: (value: string, test: (regex: RegExp) => boolean) =>
    (test(/something/) && "ERROR") || undefined,
  /** Callback that will be called when "SUCCESS" is returned. */
  onsuccess: (stdout: string, value: string) => () => {},
} as const;

export default question;
