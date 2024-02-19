import type { CodeQuestion } from "./CodeQuestion";

const question: CodeQuestion = {
  /** Invisible part of the code.
   *
   *  All instances of `__VALUE__` will be replaced with the current editor value. */
  setup: '__VALUE__;println!("SUCCESS")',
} as const;

export default question;
