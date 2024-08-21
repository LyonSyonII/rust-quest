import type { CodeQuestion } from "./CodeQuestion";

const quest = `Welcome Adventurer.
Your first quest is... To assist the local grocery store!

We expect great things of you.
The Adventurer's Guild`;

export const question: CodeQuestion = {
  code: "read_quest(0)", 
  validator: () => `${quest}SUCCESS\n`,
};