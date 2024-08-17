import { type CodeQuestion, codeMess } from "./CodeQuestion";

export default {
  /** Invisible part of the code.
   *
   *  All instances of `__VALUE__` will be replaced with the current editor value. */
  setup: `__VALUE__; println!("{name}, welcome to the Adventurer's Guild!\nSUCCESS")`,
  vars: [ {v: "NAME", d: "?"} ],
  /** Function to validate the code entered by the user.
   *
   *  If it returns `Some`, it will be displayed in the output and the code will not be executed. */
  validator: (value, test) =>
    value.includes("?") && "Hint: Just replace ? with your name!" 
    || !test(/^let name = "[A-Za-zÀ-ÖØ-öø-ÿ]+";$/) && codeMess
    || undefined,
  /** Callback that will be called when "SUCCESS" is returned. */
  onsuccess: (stdout: string) => {
    const name = stdout.substring(0, stdout.indexOf(","));
    localStorage.setItem("NAME", name);
  },
} as CodeQuestion;
