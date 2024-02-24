import type { CodeQuestion } from "./CodeQuestion";

const quest = `Welcome Adventurer.
Your first quest is... To assist the local grocery store!

We expect great things of you.
The Adventurer's Guild`;

export default {
  validator: () => quest + "SUCCESS\n",
} as CodeQuestion;
