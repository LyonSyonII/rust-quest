import type { EvalResponse } from "@components/CodeBlock/evaluate";
import { Directory, Fd, File, PreopenDirectory, WASI, strace } from "./wasi/index";

export async function initInterpreter({ color } = { color: false }): Promise<Interpreter> {
  console.time("init");

  // Build the filesystem needed for Miri to work
  // stdin, stdout and stderr all point to the same buffer
  const [miri, sysroot] = await Promise.all([
    WebAssembly.compileStreaming(
      cached_or_fetch("/wasm-rustc/bin/miri.opt.1718474653.wasm").finally(() =>
        postMessage({ downloaded: "miri.opt.1718474653.wasm" }),
      ),
    ),
    buildSysroot(),
  ]);

  const env: string[] = [];
  // Disable all Miri checks and force color output for printing to the terminal
  const args = [
    "miri",
    "--sysroot",
    "/sysroot",
    "main.rs",
    "--target",
    "x86_64-unknown-linux-gnu",
    "-Zmir-opt-level=3",
    "-Zmiri-ignore-leaks",
    "-Zmiri-permissive-provenance",
    "-Zmiri-preemption-rate=0",
    "-Zmiri-disable-alignment-check",
    "-Zmiri-disable-data-race-detector",
    "-Zmiri-disable-stacked-borrows",
    "-Zmiri-disable-validation",
    "-Zmir-emit-retag=false",
    "-Zmiri-disable-isolation",
    "-Zmiri-panic-on-unsupported",
    (color && "--color=always") || "--color=never",
  ];

  console.timeEnd("init");

  return new Interpreter(miri, sysroot, args, env);
}

class Interpreter {
  readonly miri: WebAssembly.Module;
  readonly sysroot: PreopenDirectory;
  readonly args: string[];
  readonly env: string[];
  next_thread_id: number;

  constructor(miri: WebAssembly.Module, sysroot: PreopenDirectory, args: string[], env: string[]) {
    this.miri = miri;
    this.sysroot = sysroot;
    this.args = args;
    this.env = env;
    this.next_thread_id = 1;
  }

  async run(code: string): Promise<EvalResponse> {
    const out: Uint8Array[] = [];
    const [stdin, stdout, stderr] = [new Stdio(out), new Stdio(out), new Stdio(out)];
    const tmp = new PreopenDirectory("/tmp", []);
    const root = new PreopenDirectory("/", [["main.rs", new File(encode(code))]]);
    const fds: Fd[] = [stdin, stdout, stderr, tmp, this.sysroot, root];

    const wasi = new WASI(this.args, this.env, fds, { debug: false });

    // Instantiate Miri
    const inst = await WebAssembly.instantiate(this.miri, {
      env: {
        memory: new WebAssembly.Memory({
          initial: 0,
          maximum: 1024 * 4,
          shared: false,
        }),
      },
      wasi: {
        // @ts-ignore
        "thread-spawn": function (start_arg) {
          // @ts-ignore
          const thread_id = this.next_thread_id++;
          // @ts-ignore
          inst.exports.wasi_thread_start(thread_id, start_arg);
          return thread_id;
        },
      },
      wasi_snapshot_preview1: strace(wasi.wasiImport, ["fd_prestat_get"]),
    });

    // Execute Miri
    try {
      console.time("miri execution");
      // @ts-ignore
      wasi.start(inst);
      console.timeEnd("miri execution");
      // biome-ignore lint/suspicious/noExplicitAny: can't type properly
    } catch (e: any) {
      return { error: stdout.text() || e.message };
    }

    const output = stdout.text();
    if (output.startsWith("\u001b[0m\u001b[1m\u001b[38;5;9merror")) {
      return { error: output }
    } else {
      return output;
    }
  }
}

/**
 * Capture all the output into a buffer to return it later.
 */
class Stdio extends Fd {
  private out: Uint8Array[];

  constructor(out: Uint8Array[] = []) {
    super();
    this.out = out;
  }

  fd_write(data: Uint8Array): { ret: number; nwritten: number } {
    this.out.push(data);
    return { ret: 0, nwritten: data.byteLength };
  }

  clear() {
    this.out.length = 0;
  }

  text(): string {
    const decoder = new TextDecoder("utf-8");
    let string = "";
    for (const b of this.out) {
      string += decoder.decode(b);
    }
    return string;
  }
}

async function load_external_file(path: string, alternate_path: string) {
  return new File(
    await cached_or_fetch(path)
      .catch(() => cached_or_fetch(alternate_path))
      .then((b) => b.blob())
      .then((b) => b.arrayBuffer()),
  );
}

async function cached_or_fetch(path: string) {
  // Downloads or caches the file from `path`
  // Files of more than 10MB aren't cached by fetch, so it must be done manually
  const base = import.meta.env.BASE_URL === "/" ? "" : import.meta.env.BASE_URL;
  path = base + path;
  try {
    caches;
  } catch (e) {
    return await fetch(path, { cache: "force-cache" });
  }

  const cache = await caches.open("rust-quest");
  const cached = await cache.match(path);
  if (cached) {
    return cached;
  }

  const file = await fetch(path);
  cache.put(path, file.clone());
  return file;
}

async function buildSysroot(): Promise<PreopenDirectory> {
  // Create SYSROOT directory for Miri
  return new PreopenDirectory("/sysroot", [
    [
      "lib",
      new Directory([
        [
          "rustlib",
          new Directory([
            ["wasm32-wasi", new Directory([["lib", new Directory([])]])],
            [
              "x86_64-unknown-linux-gnu",
              new Directory([
                [
                  "lib",
                  new Directory(
                    await (async () => {
                      const dir = new Map();
                      const files = [
                        "libaddr2line-b8754aeb03c02354.rlib",
                        "libadler-05c3545f6cd12159.rlib",
                        "liballoc-0dab879bc41cd6bd.rlib",
                        "libcfg_if-c7fd2cef50341546.rlib",
                        "libcompiler_builtins-a99947d020d809d6.rlib",
                        "libcore-4b8e8a815d049db3.rlib",
                        "libgetopts-bbb75529e85d129d.rlib",
                        "libgimli-598847d27d7a3cbf.rlib",
                        "libhashbrown-d2ff91fdf93cacb2.rlib",
                        "liblibc-dc63949c664c3fce.rlib",
                        "libmemchr-2d3a423be1a6cb96.rlib",
                        "libminiz_oxide-b109506a0ccc4c6a.rlib",
                        "libobject-7b48def7544c748b.rlib",
                        "libpanic_abort-c93441899b93b849.rlib",
                        "libpanic_unwind-11d9ba05b60bf694.rlib",
                        "libproc_macro-1a7f7840bb9983dc.rlib",
                        "librustc_demangle-59342a335246393d.rlib",
                        "librustc_std_workspace_alloc-552b185085090ff6.rlib",
                        "librustc_std_workspace_core-5d8a121daa7eeaa9.rlib",
                        "librustc_std_workspace_std-97f43841ce452f7d.rlib",
                        "libstd-bdedb7706a556da2.rlib",
                        "libstd-bdedb7706a556da2.so",
                        "libstd_detect-cca21eebc4281add.rlib",
                        "libsysroot-f654e185be3ffebd.rlib",
                        "libtest-f06fa3fbc201c558.rlib",
                        "libunicode_width-19a0dcd589fa0877.rlib",
                        "libunwind-747b693f90af9445.rlib",
                      ].map(async (file) => {
                        // Load libraries from "/public/wasm-rustc"
                        dir.set(
                          file,
                          await load_external_file(
                            `/wasm-rustc/lib/rustlib/x86_64-unknown-linux-gnu/lib/${file}`,
                            `https://github.com/LyonSyonII/rubri/releases/download/1.78-dev/${file}.gz`,
                          ).finally(() => postMessage({ downloaded: file })),
                        );
                      });
                      await Promise.all(files);
                      return dir;
                    })(),
                  ),
                ],
              ]),
            ],
          ]),
        ],
      ]),
    ],
  ]);
}

function encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}
