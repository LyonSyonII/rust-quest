import type { CodeQuestion } from "./CodeQuestion";

const question: CodeQuestion = {
  /** Invisible part of the code.
   *
   *  All instances of `__VALUE__` will be replaced with the current editor value. */
  setup: `
fn up() { println!("UP") }
fn down() { println!("DOWN") }
fn left() { println!("LEFT") }
fn right() { println!("RIGHT") }
__VALUE__
`.replaceAll("\n", ""),
} as const;

export default question;
