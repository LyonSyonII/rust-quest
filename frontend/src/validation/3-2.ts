import { type CodeQuestion, codeMess, replace } from "./CodeQuestion";

export default {
  setup: `
  __VALUE__
  if total == potatoes + carrots + onions {
    println!("potatoes + carrots + onions == {total}, great job!");
    println!("SUCCESS");
  }`,
  validator: (value, test) => {
    const almost = `
    You're almost there! 
    But you don't need to use "let" in this exercise.
    `;
    const copy = `
    Copying each number isn't good enough.
    You need to come up with a solution that works even if the numbers change.
    Remember to use the magical properties of the crates!
    `;
    const operations = `
    Replace the ? with only one thing, no operations other than + are necessary!
    Remember the labels on the boxes.
    `;
    const answer = value
      .substring(value.lastIndexOf("=") + 1, value.length - 1)
      .replace(" ", "");
    return ( 
      answer.includes("?") && replace
      || answer.includes("let") && almost
      || answer.split("+").some((x) => Number(x)) && copy
      || answer.match(/[-*/]/) && operations
      || !test(/^let potatoes = \d+;\nlet carrots = \d+;\nlet onions = \d+;\n*let total =\s*\w+\s*\+\s*\w+\s*\+\s*\w+\s*;\s*$/) && codeMess
      || undefined
    );
  },
} as CodeQuestion;
