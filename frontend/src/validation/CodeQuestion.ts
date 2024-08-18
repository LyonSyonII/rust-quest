export const replace = "Replace ? with your answer.";
export const codeMess =
`Seems like you've messed up the code, click the "Reset" button to return it back to its original state.
Remember to only modify the ? symbol.`
export const codeMessBlanks =
`Seems like you've messed up the code, click the "Reset" button to return it back to its original state.
Remember to only modify the blank spaces.`

/** Gets a substring between `s` and `;` */
export function getAnswer(s: string, value: string): string {
  const f = value.indexOf(s) + s.length;
  return value.substring(f, value.indexOf(";", f)).trim();
}

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
    test: (regex: RegExp, ignoreWhitespace?: boolean) => boolean,
  ) => string | undefined;
  /** Callback that will be called when "SUCCESS" is returned. */
  onsuccess?: (stdout: string, value: string) => void;
};

/** Generates a random number in Rust */
export const rustRandomNum = `{
  use std::collections::hash_map::RandomState;
  use std::hash::{BuildHasher, Hasher};
  RandomState::new().build_hasher().finish()
}`.trim();