import type { CodeQuestion } from "./CodeQuestion";

export default {
  setup: `
    fn up() { println!("UP") }
    fn down() { println!("DOWN") }
    fn left() { println!("LEFT") }
    fn right() { println!("RIGHT") }
    __VALUE__
    `.replaceAll("\n", ""),
} as CodeQuestion;
