import { SimpleQuestion } from "./2-1";
import { mc, mo } from "./CodeQuestion";

export const question = SimpleQuestion({
  code: `-1 - 1 == ${mo}?${mc}`,
  solution: `-1 - 1 == ${mo}-2${mc}`,
  answer: "-2",
  getAnswer: "-1-1==",
  correct: "That's right, -2! I see you aren't fooled easily.",
  wrong: "-1 - 1 != {a}, keep trying!",
  integrity: /^-1-1==-?\d+$/,
});
