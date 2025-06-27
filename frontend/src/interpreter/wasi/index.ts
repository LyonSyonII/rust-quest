import WASI, { WASIProcExit } from "./wasi.js";
export { WASI, WASIProcExit };

export { Fd, Inode } from "./fd.js";
export {
  ConsoleStdout,
  Directory,
  File,
  OpenDirectory,
  OpenFile,
  PreopenDirectory,
} from "./fs_mem.js";
export { OpenSyncOPFSFile, SyncOPFSFile } from "./fs_opfs.js";
export { strace } from "./strace.js";
export * as wasi from "./wasi_defs.js";
