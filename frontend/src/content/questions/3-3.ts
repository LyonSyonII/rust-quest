import { createRegExp, word } from "magic-regexp";
import { type CodeQuestion, type Validator, codeMessQuestion, mc, mo, replace } from "./CodeQuestion";
import { _, end, integer, semicolon, start } from "./regex";

const code = `let ${mo}?${mc} = ${mo}?${mc};`
const setup = `
if "__VALUE__".replace(|c: char| c.is_ascii_whitespace(), "") == "letapples=18;" {
  println!("Well done, the crate is now operative!");
  println!("SUCCESS");
} else {
 println!("Not yet, keep trying!")
}`;

const validator: Validator = (value) => {
  const regex = createRegExp(
    start, "let", _, word.or("?").as("name"), _, "=", _, integer.or("?").as("num"), semicolon, end
  );
  const matches = value.match(regex);
  if (!matches) return codeMessQuestion;
  const { name, num } = matches.groups;
  
  return value.includes("?") && replace
  || name === "apple" && "Remember to use the plural form of the label!"
  || name !== "apples" && `We need to store 'apples', not '${name}'!`
  || num !== "18" && `Remember that we need to store 18 apples, not ${num}!`
  || undefined
}

export const question: CodeQuestion = {
  code,
  setup,
  validator
};
