import type { CodeQuestion } from "./CodeQuestion";

const replace = "Replace ? with your answer.";

const question: CodeQuestion = {
  setup: `
    if "__VALUE__".replace(" ", "") == "letapples=18;" {
      println!("Well done, the crate is now operative!");
      println!("SUCCESS");
    } else { println!("Not yet, keep trying!") }`,
  validator: (value) =>
    value.includes("apple ") && "Remember to use the plural form of the label!" 
    || value.includes("let apples =") && !value.includes("18") && "Remember that you need to store 18 apples!"
    || value.includes("?") && replace 
    || undefined,
} as const;

export default question;
