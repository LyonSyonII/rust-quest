import { createRegExp } from "magic-regexp";
import { type CodeQuestion, type Validator, codeMessQuestion, mc, mo } from "./CodeQuestion";
import { _, any, bool, end, semicolon, start } from "./regex";

const code = `
let is_human = ${mo}true${mc};
let mut registered = ${mo}false${mc};
let mut dead = ${mo}?${mc};
let mut wears_glasses = ${mo}?${mc};
`;

const setup = `
__VALUE__;
let glasses = match wears_glasses {
    true => "And I also wear glasses, we match 😉",
    false => "And good! As an adventurer, it's better if you don't need glasses."
};
println!("I'm glad you're not dead!\\n{glasses}\\nSUCCESS");
`;

const validator: Validator = (value) => {
  const regex = createRegExp(
    start,
    "let is_human =", _, bool.as("human"), semicolon,
    "let mut registered =", _, bool.as("registered"), semicolon,
    "let mut dead =", _, any.times.any().as("dead"), semicolon,
    "let mut wears_glasses =", _, any.times.any().as("glasses"), semicolon,
    end
  );
  const matches = value.match(regex);
  if (!matches) return codeMessQuestion;
  let { human, registered, dead, glasses } = matches.groups;
  
  const fillHuman = "[is_human] Fill in if you're human!";
  const fillRegistered = "[registered] Fill in if you're registered!";
  const fillDead = "[dead] Fill in if you're dead!";
  const fillGlasses = "[wears_glasses] Fill in if you wear glasses!";
  
  if (!human) return fillHuman;
  if (!registered) return fillRegistered;
  if (!dead) return fillDead;
  if (!glasses) return fillGlasses;
  
  dead = dead.trim();
  glasses = glasses.trim();
  
  const wrong = " The answer has to be 'true' or 'false', look closely at the previous values.";
  return dead.includes("?") && "[dead] Are you dead or alive?"
      || dead === "true" && "[dead] Are you sure you're dead? How are you answering this question?"
      || dead !== "false" && `[dead]${wrong}`
      || registered === "true" && "[registered] You're not registered yet!"
      || glasses.includes("?") && "[wears_glasses] Do you wear glasses?"
      || !(/true|false/).test(glasses) && `[wears_glasses]${wrong}`
      || undefined
}

export const question: CodeQuestion = {
  code,
  setup,
  vars: [{
    v: "NAME",
    d: "Hero",
    c: (v) => v[0]?.toUpperCase()
  }],
  validator,
};
