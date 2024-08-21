import { type CodeQuestion, type Validator, codeMessQuestion, getAnswer, replace } from "./CodeQuestion";

const code = `
let mut height = ?;
let mut weight = ?;
let mut money = 12.50;
`;

const setup = `
__VALUE__
println!("Your height is {height} meters, your weight is {weight} kilograms and you have {money} coins.SUCCESS");
`;

const validator: Validator = (value, test) => {
  const height = getAnswer("height = ", value);
  const weight = getAnswer("weight = ", value);
  return height.includes("?") && "[height] Fill in your height!"
      || (Number.isNaN(Number(height)) || height.length === 0) && "[height] Height must be a number!"
      || !height.includes(".") && "[height] Wow, that's a very round height!\nTry adding some decimals to make it more precise."
      || Number(height) < 0 && `[height] You are ${height} meters tall? How is that even possible?`
      || weight.includes("?") && "[weight] Fill in your weight!"
      || Number.isNaN(Number(weight)) && "[weight] Weight must be a number!"
      || Number(weight) < 0 && `[weight] You weigh ${weight} kilograms? That's not possible!`
      || !test(/^let mut height =\s*(-?\d+.\d+)\s*;\nlet mut weight =\s*(-?\d+(.\d+)?)\s*;\nlet mut money =\s*(\d+.\d+)\s*;$/) && codeMessQuestion
      || value.includes("?") && replace
      || undefined
}

export const question: CodeQuestion = {
  code,
  setup,
  vars: [{ v: "NAME", d: "Hero" }],
  validator,
};
