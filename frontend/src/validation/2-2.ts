import { SimpleQuestion } from "./2-1";
import type { CodeQuestion } from "./CodeQuestion";

export default SimpleQuestion({
  answer: "-2",
  getAnswer: "-1-1==",
  correct: "That's right, -2! I see you aren't fooled easily.",
  wrong: "-1 - 1 != {a}, keep trying!",
  integrity: /^-1-1==-?\d+$/
}) as CodeQuestion;