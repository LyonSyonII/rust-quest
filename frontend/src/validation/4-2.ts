import { type CodeQuestion, codeMess, getAnswer, replace } from "./CodeQuestion";

function validator(value: string, test: (regex: RegExp, ignoreWhitespace?: boolean) => boolean): string | undefined {
  const height = getAnswer("height = ", value);
  const weight = getAnswer("weight = ", value);
  return height.includes("?") && "[height] Fill in your height!"
      || (isNaN(Number(height)) || height.length == 0) && "[height] Height must be a number!"
      || !height.includes(".") && "[height] Wow, that's a very round height!\nTry adding some decimals to make it more precise."
      || Number(height) < 0 && `[height] You are ${height} meters tall? How is that even possible?`
      || weight.includes("?") && "[weight] Fill in your weight!"
      || isNaN(Number(weight)) && "[weight] Weight must be a number!"
      || Number(weight) < 0 && `[weight] You weigh ${weight} kilograms? That's not possible!`
      || !test(/^let mut height =\s*(-?\d+.\d+)\s*;\nlet mut weight =\s*(-?\d+(.\d+)?)\s*;\nlet mut money =\s*(\d+.\d+)\s*;$/) && codeMess
      || value.includes("?") && replace
      || undefined
}

export default {
  setup: `__VALUE__ println!("Your height is {height} meters, your weight is {weight} kilograms and you have {money} coins.SUCCESS");`,
  vars: [{ v: "NAME", d: "Hero" }],
  validator,
} as CodeQuestion;
