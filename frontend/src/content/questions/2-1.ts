import { type CodeQuestion, cleanProtectedCode, codeMessQuestion, mc, mo, replace } from "./CodeQuestion";

type SimpleQuestion = {
  code: string;
  answer: string;
  /** The part of the original code that should be removed to get the user's answer. */
  getAnswer: string;
  correct: string;
  wrong: string;
  /** Regex that checks the integrity of the input. Ignores whitespace. */
  integrity: RegExp;
}; 
export function SimpleQuestion({ code, answer, getAnswer, correct, wrong, integrity }: SimpleQuestion): CodeQuestion {
  const setup = `
    let a = "__VALUE__".replace(" ", "").replace("${getAnswer}", "");
    match a.as_str() {
      "${answer}" => println!("${correct}SUCCESS\\n"),
      _ => println!("${wrong}"),
    }
    `;
  return {
    code,
    setup,
    validator: (value: string, test) =>
         value.includes("?") && replace
      || !test(integrity, true) && codeMessQuestion
      || undefined
  } as const;
}

export type FreeQuestion = {
  code: string;
  correct: string;
  /** Regexes to check before accepting the input. Ignores whitespace. */
  validators?: RegExp[];
};
export function FreeQuestion({ code, correct, validators = [] }: FreeQuestion): CodeQuestion {
  const wrongAnswer = "Wrong answer, try again!"
  const setup = `if __VALUE__ { println!("${correct}SUCCESS\\n"); } else { println!("${wrongAnswer}"); }`;
  return {
    code,
    setup, 
    validator: (value: string, test) => 
      value.includes("?") && replace
      || !validators.some((v) => test(v, true)) && codeMessQuestion
      || undefined 
  } as const;
}

export const question: CodeQuestion = SimpleQuestion({
  code: `5 + 5 == ${mo}?${mc}`,
  answer: "10",
  getAnswer: "5+5==",
  correct: "5 + 5 == 10, good job!",
  wrong: "5 + 5 != {a}, keep trying!",
  integrity: /^5\+5==\d+$/,
});