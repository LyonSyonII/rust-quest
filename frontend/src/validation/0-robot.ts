import type { CodeQuestion } from "./CodeQuestion";

/** `up` / `down` / `left` / `right` */
export const basicMovement: CodeQuestion = {
  setup: `
  fn up() { println!("UP") }
  fn down() { println!("DOWN") }
  fn left() { println!("LEFT") }
  fn right() { println!("RIGHT") }
  __VALUE__
  `.replaceAll("\n", "")
} as const;

export const lookLeftRight: (
  rows: number,
  cols: number,
  start: number,
  enemies: number[]
  ) => CodeQuestion = (rows, cols, start, enemies) => {
  return {
    setup: `
    const ROWS: usize = ${rows};
    const COLS: usize = ${cols};
    const ENEMIES: &[usize] = &[${enemies.join(", ")}];

    let mut pos = ${start};
    
    let is_slime_left = || {
      if pos % COLS == 0 {
        return false;
      }
      ENEMIES.contains(&(pos-1))
    };
    let is_slime_right = || {
      if pos % COLS == COLS-1 {
        return false;
      }
      ENEMIES.contains(&(pos+1))
    };
    
    fn up() {
      if pos < COLS {
        return;
      }
      pos -= COLS;
      println!("UP");
    }
    fn down() {
      if pos >= ROWS * (COLS-1) {
        return;
      }
      pos += COLS;
      println!("DOWN");
    }
    fn left() { 
      if pos % COLS == 0 {
        return;
      }
      println!("LEFT");
      pos -= 1;
    }
    fn right() { 
      if pos % COLS == COLS-1 {
        return;
      }
      println!("RIGHT");
      pos += 1;
    }
    ${basicMovement.setup}
    `.replaceAll("\n", "")
  }
};

export default {
  setup: `
    fn up() { println!("UP") }
    fn down() { println!("DOWN") }
    fn left() { println!("LEFT") }
    fn right() { println!("RIGHT") }
    __VALUE__
    `.replaceAll("\n", ""),
} as CodeQuestion;
