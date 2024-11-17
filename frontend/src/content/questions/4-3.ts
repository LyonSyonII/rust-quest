import { createRegExp, word } from "magic-regexp";
import { type CodeQuestion, type Validator, codeMessQuestion, mc, mo, replace } from "./CodeQuestion";
import { _, char, end, semicolon, start, stringZ, wrongCharZ } from "./regex";

const code = `
let initial1 = '${mo}$NAME${mc}';
let initial2 = ${mo}?${mc};
let mut cardinal = ${mo}?${mc};
`;

const setup = `
__VALUE__
let cardinal = match cardinal {
    'N' => "North",
    'S' => "South",
    'E' => "East",
    'W' => "West",
    _ => unreachable!()
};
println!("Your initials are {initial1}.{initial2}. and your favourite cardinal point is {cardinal}.SUCCESS");
`;

const validator: Validator = (value) => {
  const answer = wrongCharZ.or(stringZ).or(word).or("?").optionally();
  
  const regex = createRegExp(
    start,
    "let initial1 =", _, char.as("initial1"), semicolon,
    "let initial2 =", _, answer.as("initial2"), semicolon,
    "let mut cardinal =", _, answer.as("cardinal"), semicolon,
    end
  );
  const matches = value.match(regex);
  if (!matches) return codeMessQuestion;
  const { initial1, initial2, cardinal } = matches.groups;
  
  const fillFirst = "[initial1] Fill in your first initial!";
  const fillSecond = "[initial2] Fill in your second initial!";
  const fillCardinal = "[cardinal] Fill in your favourite cardinal point!";
  
  if (!initial1) return fillFirst;
  if (!initial2) return fillSecond;
  if (!cardinal) return fillCardinal;
  
  return initial2.includes("?") && fillSecond
  || initial2.length === 2 && fillSecond
  || initial2.length > 3 && "[initial2] An initial has only one character!"
  || initial2.includes('"') && "[initial2] You're almost there, but an initial has only one character, so there's a better way to write it!\nLook closely at how 'initial1' is written."
  || initial2.toUpperCase() !== initial2 && "[initial2] An initial should be uppercase!"
  || !initial2.includes("'") && "[initial2] Something's wrong with the way you wrote your initial.\nLook closely at how the first one is written."
  || cardinal.includes("?") && fillCardinal
  || cardinal.includes('"') && "[cardinal] You're almost there, but a cardinal point has only one character, so there's a better way to write it!\nLook closely at how 'initial1' is written."
  || !cardinal.includes("'") && "[cardinal] Something's wrong with the way you wrote the cardinal point.\nLook closely at how 'initial1' is written."
  || !(/'[nsew]'/i).test(cardinal) && `[cardinal] ${cardinal} is not a cardinal point! Try 'N', 'S', 'E' or 'W'.`
  || value.includes("?") && replace
  || undefined
}

export const question: CodeQuestion = {
  code,
  setup,
  vars: [{
    v: "NAME",
    d: "Hero",
    c: (v) => v[0]?.toUpperCase() || "H"
  }],
  validator,
};
