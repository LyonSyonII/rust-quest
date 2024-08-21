import { SimpleQuestion } from "./2-1";

export const question = SimpleQuestion({
  code: "16 / 4 == 2 * ?",
  answer: "2",
  getAnswer: "16/4==2*",
  correct: "Perfect! Now you know how to make the computer do basic calculations for you, well done!",
  wrong: "16 / 4 != 2 * {a}, keep trying!",
  integrity: /^16\/4==2\*\d+$/
});