import { type CodeQuestion, type Validator, codeMess, getAnswer, mc, mo, replace } from "./CodeQuestion";

const code = `
let name = "${mo}$NAME${mc}";
let surname = ${mo}?${mc};
let mut age = ${mo}?${mc};
`;

const setup =  `
  __VALUE__ 
  println!("Welcome, {name} {surname}!\\nYou're {age} years old.SUCCESS");`

const validator: Validator = (value, test) => {
  const surname = getAnswer("surname = ", value).trim();
  const age = getAnswer("age = ", value).trim();
  return test(/let name = "";/) && "[name] Fill in your name!"
      || !test(/let name = ".+";/) && "[name] Something is wrong with your name, click the reset button if you changed it by mistake!"
      || test(/let surname = (\?|"");/) && "[surname] Fill in your surname!"
      || !surname.includes('"') && "[surname] Something is wrong with your surname.\nLook closely to how 'name' is written!"
      || (age.includes("?") || age.length === 0) && "[age] Fill in your age!"
      || Number.isNaN(Number(age)) && "[age] Age must be a number!"
      || Number(age) < 0 && "[age] Age can't be negative, can it? 😉"
      || Number(age) < 15 && "[age] You must be at least 15 years old to go adventuring!"
      || value.includes("?") && replace
      || !test(/^let name = ".*";\nlet surname = ".*";\nlet mut age = \s*\d+\s*;$/) && codeMess
      || undefined;
}

export const question: CodeQuestion = {
  code,
  setup,
  vars: [{ v: "NAME", d: "Hero" }],
  onsuccess: (_, value) => {
    const name = getAnswer("name = ", value).slice(2, -2);
    localStorage.setItem("NAME", name);
  },
  validator,
};
