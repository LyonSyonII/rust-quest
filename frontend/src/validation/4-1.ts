import { type CodeQuestion, getAnswer } from "./CodeQuestion";

const code = `
let name = "$NAME";
let surname = ?;
let mut age = ?;
`;

const setup = `
__VALUE__ println!("Welcome, {name} {surname}!\\nYou're {age} years old.SUCCESS");
`;

function onsuccess(value: string): void {
  const name = getAnswer("name = ", value).slice(1, -1);
  localStorage.setItem("NAME", name);
}

function validator(value: string): string | undefined {}

const question: CodeQuestion = {
  code,
  setup,
  vars: [{ variable: "NAME", default: "Hero" }],
  validator,
  onsuccess,
} as const;

export default question;
