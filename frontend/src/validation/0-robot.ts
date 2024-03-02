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
    
    let pos = std::cell::RefCell::new(${start});
    
    let is_slime_left = || {
      let pos = *pos.borrow();
      
      if pos % COLS == 0 {
        return false;
      }
      for i in 0..ROWS {
        for j in 0..(pos % COLS) {
          if ENEMIES.contains(&(i * COLS + j)) { return true }
        }
      }
      false
    };
    let is_slime_right = || {
      let pos = *pos.borrow();

      if pos % COLS == COLS-1 {
        return false;
      }
      for i in 0..ROWS {
        for j in (pos % COLS)..COLS {
          if ENEMIES.contains(&(i * COLS + j)) { return true }
        }
      }
      false
    };
    let isl = is_slime_left;
    let isr = is_slime_right;
    
    let up = || {
      if *pos.borrow() < COLS {
        return;
      }
      *pos.borrow_mut() -= COLS;
      println!("UP");
    };
    let down =  || {
      if *pos.borrow() >= ROWS * (COLS-1) {
        return;
      }
      *pos.borrow_mut() += COLS;
      println!("DOWN");
    };
    let left = || { 
      if *pos.borrow() % COLS == 0 {
        return;
      }
      println!("LEFT");
      *pos.borrow_mut() -= 1;
    };
    let right = || { 
      if *pos.borrow() % COLS == COLS-1 {
        return;
      }
      println!("RIGHT");
      *pos.borrow_mut() += 1;
    };
    let u = up;
    let d = down;
    let l = left;
    let r = right;

    __VALUE__
    `.replaceAll(/\s\s|\n/g, "")
  }
};

export default basicMovement;
