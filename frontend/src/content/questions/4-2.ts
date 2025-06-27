import {
  type CodeQuestion,
  codeMessQuestion,
  getAnswer,
  mc,
  mo,
  replace,
  type Validator,
} from "./CodeQuestion";

const code = `
let mut height = ${mo}?${mc};
let mut weight = ${mo}?${mc};
let mut money = ${mo}12.50${mc};
`;

const setup = `
__VALUE__
println!("You measure {height} meters, you weight {weight} kilograms and you have {money} coins.SUCCESS");
`;

const validator: Validator = (value, test) => {
  const height = getAnswer("height = ", value).trim();
  const weight = getAnswer("weight = ", value).trim();
  return (
    ((height.includes("?") || height.length == 0) && "[height] Fill in your height!") ||
    (/^\d+,\d+$/.test(height) &&
      "[height] Close! But in most programming languages a dot '.' is used for separating decimal numbers.") ||
    ((Number.isNaN(Number(height)) || height.length === 0) &&
      "[height] Height must be a number!") ||
    (!height.includes(".") &&
      "[height] Wow, that's a very round height!\nTry adding some decimals to make it more precise.") ||
    (Number(height) < 0 && `[height] You are ${height} meters tall? How is that even possible?`) ||
    ((weight.includes("?") || weight.length == 0) && "[weight] Fill in your weight!") ||
    (Number.isNaN(Number(weight)) && "[weight] Weight must be a number!") ||
    (Number(weight) < 0 && `[weight] You weigh ${weight} kilograms? That's not possible!`) ||
    (!test(
      /^let mut height =\s*(-?\d+.\d+)\s*;\nlet mut weight =\s*(-?\d+(.\d+)?)\s*;\nlet mut money =\s*(\d+.\d+)\s*;$/,
    ) &&
      codeMessQuestion) ||
    (value.includes("?") && replace) ||
    undefined
  );
};

export const question: CodeQuestion = {
  code,
  setup,
  vars: [{ v: "NAME", d: "Hero" }],
  validator,
};
