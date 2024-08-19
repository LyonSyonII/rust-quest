import { createRegExp, word } from "magic-regexp";
import { type CodeQuestion, codeMessQuestion, replace } from "./CodeQuestion";
import { _, end, integer, semicolon, start } from "./regex";

function validator(value: string): string | undefined {
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

export default {
  setup: `
    if "__VALUE__".replace(" ", "") == "letapples=18;" {
      println!("Well done, the crate is now operative!");
      println!("SUCCESS");
    } else { println!("Not yet, keep trying!") }`,
  validator
} as CodeQuestion;
