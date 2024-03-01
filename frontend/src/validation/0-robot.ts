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
    
    let up = || {
      if pos < COLS {
        return;
      }
      pos -= COLS;
      println!("UP");
    };
    let down =  || {
      if pos >= ROWS * (COLS-1) {
        return;
      }
      pos += COLS;
      println!("DOWN");
    };
    let left = || { 
      if pos % COLS == 0 {
        return;
      }
      println!("LEFT");
      pos -= 1;
    };
    let right = || { 
      if pos % COLS == COLS-1 {
        return;
      }
      println!("RIGHT");
      pos += 1;
    };
    __VALUE__
    `.replaceAll("\n", "")
  }
};

export default basicMovement;
