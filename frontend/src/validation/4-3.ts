import { type CodeQuestion, getAnswer, replace, codeMess } from "./CodeQuestion";

function validator(value: string, test: (regex: RegExp, ignoreWhitespace?: boolean) => boolean): string | undefined {
  const charegex = /'.'/;
  const initial2 = getAnswer("initial2 = ", value);
  const cardinal = getAnswer("cardinal = ", value);
  
  return initial2.includes("?") && "[initial2] Fill in your second initial!"
  || initial2.includes('"') && "[initial2] You're almost there, but an initial has only one character, so there's a better way to write it!\nLook closely at how 'initial1' is written."
  || !charegex.test(initial2) && "[initial2] Something is wrong with your second initial.\nLook closely at how 'initial1' is written!"
  || initial2.length > 3 && "[initial2] An initial has only one character!"
  || initial2.toUpperCase() !== initial2 && "[initial2] An initial should be uppercase!"
  || cardinal.includes("?") && "[cardinal] Fill in your favourite cardinal point!"
  || cardinal.includes('"') && "[cardinal] You're almost there, but a cardinal point has only one character, so there's a better way to write it!\nLook closely at how 'initial1' is written."
  || !charegex.test(cardinal) && "[cardinal] Something is wrong with your cardinal point.\nLook closely at how 'initial1' is written!"
  || !(/'[nsew]'/i).test(cardinal) && `[cardinal] ${cardinal} is not a cardinal point! Try 'N', 'S', 'E' or 'W'.`
  || value.includes("?") && replace
  || !test(/let initial1 =\s*'\w*'\s*;\n\s*let initial2 =\s*('?)(\w*)('?)\s*;\n\s*let mut cardinal =\s*('?)(\w*)('?)\s*;/) && codeMess
  || undefined
}

export default {
  setup: `
  __VALUE__
  let cardinal = match cardinal {
      'N' => "North",
      'S' => "South",
      'E' => "East",
      'W' => "West",
      _ => unreachable!()
  };
  println!("Your initials are {initial1}.{initial2}. and your favourite cardinal point is {cardinal}.\\nSUCCESS");
  `,
  vars: [{
    v: "NAME",
    d: "Hero",
    c: (v) => v[0]?.toUpperCase()
  }],
  validator,
} as CodeQuestion;
