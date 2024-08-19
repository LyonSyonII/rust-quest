import { type CodeQuestion, codeMessQuestion, replace } from "./CodeQuestion";


export default {
  setup: `
  __VALUE__
  if apples == 16 + 64 {
    println!("Perfect, apples = {apples}, now you know how to modify values!");
    println!("SUCCESS");
  } else {
    println!("Not yet, keep trying!");
  }`,
  validator: (value, test) => {
    const v = value.replaceAll(" ", "");
    const answer = v.substring(v.indexOf(";"));
    return answer.includes("?") && replace
        || answer.includes("letmut") && "'let' and 'mut' are used to create mutable magical boxes, but this one already exists!"
        || answer.includes("let") && "'let' is used to create magical boxes, but this one already exists!"
        || answer.includes("16") && "Remember, we need reusable code!\nLook at the previous exercise if you need some inspiration."
        || !test(/^let mut apples = 16;\n.*;$/) && codeMessQuestion
        || undefined
  }
} as CodeQuestion;