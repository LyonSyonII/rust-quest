{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };
  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      overlays = [];
      pkgs = import nixpkgs {
        inherit system overlays;
      };
    in
    with pkgs;
    {
      devShells.${system}.default = mkShell {
        inherit nixpkgs;
        buildInputs = with pkgs.buildPackages; [
          rustup
          sccache
          mold
          cargo-watch
        ];
        shellHook = ''
          rustup toolchain install stable
          rustup toolchain install nightly-2023-10-31 -c miri rustc-codegen-cranelift-preview rust-src rust-analyzer rustfmt clippy
        '';
      };
    };
}
