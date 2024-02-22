import type { CodeQuestion } from "./CodeQuestion";

export const quest = `
Greetings adventurer!
We hope you're ready for some fun, because this will be your first hunt quest!

As you're still a rookie, your mission will be to kill some slimes and collect their blobs, which are quite valued in alchemy.

Because you're a Programmer, you won't be killing them yourself.
Instead, with this letter comes the spell "summon robot", which will summon a companion that you'll have to command.

Read the instructions before using it!
Good luck!
`;

const question: CodeQuestion = {
  /** Function to validate the code entered by the user.
   *
   *  If it returns `Some`, it will be displayed in the output and the code will not be executed. */
  validator: () => quest.trim() + "SUCCESS"
} as const;

export default question;
