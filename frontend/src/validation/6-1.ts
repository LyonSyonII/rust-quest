import { type CodeQuestion, codeMess, replace } from "./CodeQuestion";

const MAX_TEMP = 0;
const MIN_TEMP = -2;
const temp = Math.random() ? MAX_TEMP + 1 : MIN_TEMP - 1;

export default {
  setup: `
  use std::collections::hash_map::RandomState;
  use std::hash::{BuildHasher, Hasher};
  let rand = RandomState::new().build_hasher().finish();
  
  const MAX_TEMP: i32 = ${MAX_TEMP};
  const MIN_TEMP: i32 = ${MIN_TEMP};
  let temp = if rand % 2 == 0 { MAX_TEMP + 1 } else { MIN_TEMP - 1};
  let mut target = MAX_TEMP + 10;

  __VALUE__

  if temp >= MAX_TEMP && target >= MAX_TEMP {
    println!("temp = {temp}, target = {target}");
    println!("The current and target temperatures are too high, the fish will spoil!");
  } else if temp <= MIN_TEMP && target <= MIN_TEMP {
    println!("temp = {temp}, target = {target}");
    println!("The current and target temperatures are too low, the fish will freeze!"); 
  } else {
    println!("temp = {temp}, target = {target}");
    println!("The temperature target now adjusts correctly!\nSUCCESS"); 
  }
  `,
  validator: (value, test) => {
    return undefined;
  }
} as CodeQuestion;