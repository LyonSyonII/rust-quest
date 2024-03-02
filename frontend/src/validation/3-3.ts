import { codeMess, replace, type CodeQuestion } from "./CodeQuestion";

// TODO: Add extra validation for the name of the variable

export default {
  setup: `
    if "__VALUE__".replace(" ", "") == "letapples=18;" {
      println!("Well done, the crate is now operative!");
      println!("SUCCESS");
    } else { println!("Not yet, keep trying!") }`,
  validator: (value, test) =>
    value.includes("?") && replace
    || value.includes("apple ") && "Remember to use the plural form of the label!" 
    || value.includes("let apples =") && !value.includes("18") && "Remember that you need to store 18 apples!"
    || !test(/^let \w+ = \d+;$/) && codeMess
    || undefined,
} as CodeQuestion;
