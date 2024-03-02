import { codeMess, replace, type CodeQuestion } from "./CodeQuestion";


export default {
  setup: `
    __VALUE__
    if apples == 16 {
      println!("Once you say the magical words 'let mut' the barrier sorrounding the box disappears, and you're able to take the apples.\\nGood job!");
      println!("SUCCESS");
    } else {
      println!("There should be 16 apples in the box, but you have {apples}, did you replace some values?");
    }`,
  validator: (value) => {
    const v = value.replace(/\s/g, "");
    const secondLine = v.substring(v.indexOf(";")).trim();
    return value.includes("?") && replace
        || value.includes("letmut") && "Good guess! But each directive should be on its own, maybe try adding a space?"
        || v.includes("mutlet") && "Almost! But the panel says to 'add' the directive, so maybe you need to use it in another order?"
        || v.startsWith("mutapples") && "You're nearly there, but remember the first magical word 'let'!\nThe panel says to 'add mut', not replace."
        || v.startsWith("letapples") && "The box still doesn't let you take the apples!\nRemember what the panel says: 'add the `mut` directive'"
        || secondLine.includes("let") && "Looks like you've modified the second line, replace only the ? part!"
        // TODO: Add validation to ensure that only the first line is modified
        || !/^letmutapples=18;apples=apples-2;$/.test(v) && codeMess
        || undefined
  }
} as CodeQuestion;
