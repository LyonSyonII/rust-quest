import { type CodeQuestion, mc, mo } from "./CodeQuestion";

export const question: CodeQuestion = {
  code: `println!("Hello ${mo}World${mc}!")`,
  setup: '__VALUE__;println!("SUCCESS")',
};
