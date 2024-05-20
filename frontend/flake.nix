{
  inputs = { nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable"; };
  outputs = { self, nixpkgs }:
    let
      pkgs = nixpkgs.legacyPackages.x86_64-linux.pkgs;
    in
    with pkgs;
    {
      devShells.x86_64-linux.default = mkShell {
        buildInputs = [
          nodejs_22
          nodePackages.pnpm
        ];
      };
    };
}