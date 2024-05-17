import { createRegExp, exactly, maybe, word } from "magic-regexp";
import { codeMess, replace, type CodeQuestion } from "./CodeQuestion";
import { _, end, line, semicolon, start } from "./regex";

function validator(value: string): string | undefined {
  const keyword = maybe(word);

  const regex = createRegExp(
    start, 
    exactly("?").or(keyword.as("_let"), _, keyword.as("_mut")), _, "apples", _, "=", _, "18", semicolon, 
    maybe("apples", _, "=", _, "apples", _, "-", _, "2", semicolon).as("line2").or(line, _),
    end
  );
  const matches = value.match(regex);
  
  if (!matches) return codeMess;
  const { _let, _mut, line2 } = matches.groups;
  
  return value.includes("?") && replace
  || /letmut|mutlet/.test(value) && "Good guess! But each directive should be on its own, maybe try adding a space?"
  || !line2 && "Looks like you've modified the second line, replace only the ? part!"
  || _let === "mut" && _mut === "let" && "Almost! But the panel says to 'add' the directive, so maybe you need to use it in another order?"
  || _let === "mut" && !_mut && "You're nearly there, but remember the first magical word 'let'!\nThe panel says to 'add mut', not replace."
  || _let === "let" && !_mut && "The box still doesn't let you take the apples!\nRemember what the panel says: 'add the `mut` directive'"
  || undefined
}

export default {
  setup: `
    __VALUE__
    if apples == 16 {
      println!("Once you say the magical words 'let mut' the barrier sorrounding the box disappears, and you're able to take the apples.\\nGood job!");
      println!("SUCCESS");
    } else {
      println!("There should be 16 apples in the box, but you have {apples}, did you replace some values?");
    }`,
  validator
} as CodeQuestion;
