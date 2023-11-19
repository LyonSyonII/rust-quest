#![no_implicit_prelude]

pub use ::std::collections;
pub use prelude::rust_2021::*;

pub mod prelude {
    pub mod rust_2021 {
        pub use ::std::{assert, assert_eq, assert_ne, dbg, format, matches, panic, print, println, todo, unimplemented, unreachable, vec};
    }
}