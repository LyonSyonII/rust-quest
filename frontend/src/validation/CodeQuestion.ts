import type { Option } from "@sapphire/result";

export type CodeQuestion = {
  /** Invisible part of the code.
   *
   *  All instances of `__VALUE__` will be replaced with the current editor value. */
  setup?: string;
  vars?: {
    /** Name of the variable. */
    v: string;
    /** Default value if variable does not exist. */
    d: string;
    /** Transform the variable's value before replacing it. */
    c?: (value: string) => string;
  }[];
  /** Function to validate the code entered by the user.
   *
   *  If it returns `Some`, it will be displayed in the output and the code will not be executed. */
  validator?: (
    value: string,
    test: (regex: RegExp) => boolean,
  ) => string | undefined;
  /** Callback that will be called when "SUCCESS" is returned. */
  onsuccess?: (stdout: string, value: string) => void;
};

export const replace = "Replace ? with your answer.";

/** Gets a substring between `s` and `;` */
export function getAnswer(s: string, value: string): string {
  const f = value.indexOf(s) + s.length;
  return value.substring(f, value.indexOf(";", f)).trim();
}
