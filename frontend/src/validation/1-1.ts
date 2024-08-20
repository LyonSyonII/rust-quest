import type { CodeQuestion } from "./CodeQuestion";

export const question: CodeQuestion = {
  code: 'println!("Hello World!")',
  setup: '__VALUE__;println!("SUCCESS")',
} as const;
