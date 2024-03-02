import { type CodeQuestion, getAnswer, replace } from "./CodeQuestion";

function validator(value: string, test: (regex: RegExp, ignoreWhitespace?: boolean) => boolean): string | undefined {
  const surname = getAnswer("surname = ", value);
  const age = getAnswer("age = ", value);
  return test(/let name = "";/) && "[name] Fill in your name!"
      || !test(/let name = ".+";/) && "[name] Something is wrong with your name, click the reset button if you changed it by mistake!"
      || test(/let surname = (\?|"");/) && "[surname] Fill in your surname!"
      || !surname.includes('"') && "[surname] Something is wrong with your surname.\nLook closely to how 'name' is written!"
      || (age.includes("?") || age.trim().length === 0) && "[age] Fill in your age!"
      || isNaN(Number(age)) && "[age] Age must be a number!"
      || Number(age) < 0 && "[age] Age can't be negative, can it? 😉"
      || Number(age) < 15 && "[age] You must be at least 15 years old to go adventuring!"
      || value.includes("?") && replace
      || !test(/^let name = ".*";\nlet surname = ".*";\nlet mut age = \d+;$/) && "Seems like you've messed up the code, click the 'Reset' button to return it back to its original state."
      || undefined;
}

export default {
  setup: `__VALUE__ println!("Welcome, {name} {surname}!\\nYou're {age} years old.SUCCESS");`,
  vars: [{ v: "NAME", d: "Hero" }],
  onsuccess: (_, value) => {
    const name = getAnswer("name = ", value).slice(1, -1);
    localStorage.setItem("NAME", name);
  },
  validator,
} as CodeQuestion;
