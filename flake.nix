{
  description = "MCP server for generating Nix flake development environments";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        nix-devshell-mcp = pkgs.buildNpmPackage {
          pname = "nix-devshell-mcp";
          version = "1.0.0";

          src = ./.;

          npmDepsHash = "sha256-EDdFtIbgq1EcPoWu81Xl4YfzpEqQBybaR7cPoQJI84E=";

          # Build phase
          buildPhase = ''
            runHook preBuild
            npm run build
            runHook postBuild
          '';

          # Install phase
          installPhase = ''
            runHook preInstall

            # Create output directory structure
            mkdir -p $out/bin
            mkdir -p $out/lib/node_modules/nix-devshell-mcp

            # Copy built files
            cp -r build $out/lib/node_modules/nix-devshell-mcp/
            cp -r node_modules $out/lib/node_modules/nix-devshell-mcp/

            # Copy templates directory with all profiles
            if [ -d templates ] && [ "$(ls -A templates 2>/dev/null)" ]; then
              cp -r templates $out/lib/node_modules/nix-devshell-mcp/
            else
              # Create empty templates directory
              mkdir -p $out/lib/node_modules/nix-devshell-mcp/templates
            fi

            cp package.json $out/lib/node_modules/nix-devshell-mcp/

            # Create executable wrapper
            cat > $out/bin/nix-devshell-mcp <<EOF
            #!${pkgs.nodejs}/bin/node
            import('file://$out/lib/node_modules/nix-devshell-mcp/build/index.js');
            EOF
            chmod +x $out/bin/nix-devshell-mcp

            runHook postInstall
          '';

          meta = with pkgs.lib; {
            description = "MCP server for generating Nix flake development environments";
            homepage = "https://github.com/kcalvelli/nix-devshell-mcp";
            license = licenses.isc;
            maintainers = [ ];
            platforms = platforms.all;
          };
        };
      in
      {
        # Package output - for use in NixOS configurations and other flakes
        packages = {
          default = nix-devshell-mcp;
          nix-devshell-mcp = nix-devshell-mcp;
        };

        # App output - for use with `nix run`
        apps = {
          default = {
            type = "app";
            program = "${nix-devshell-mcp}/bin/nix-devshell-mcp";
          };
          nix-devshell-mcp = {
            type = "app";
            program = "${nix-devshell-mcp}/bin/nix-devshell-mcp";
          };
        };

        # Development shell
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs
            nodePackages.npm
            nodePackages.typescript
            nodePackages.typescript-language-server
          ];

          shellHook = ''
            echo "nix-devshell-mcp development environment"
            echo "Run 'npm install' to install dependencies"
            echo "Run 'npm run build' to build the project"
            echo "Run 'npm run dev' to start development server"
          '';
        };
      }
    ) // {
      # NixOS module - for integration with NixOS configurations
      nixosModules.default = { config, lib, pkgs, ... }:
        with lib;
        let
          cfg = config.services.nix-devshell-mcp;
        in
        {
          options.services.nix-devshell-mcp = {
            enable = mkEnableOption "nix-devshell-mcp MCP server";

            package = mkOption {
              type = types.package;
              default = self.packages.${pkgs.system}.default;
              description = "The nix-devshell-mcp package to use";
            };
          };

          config = mkIf cfg.enable {
            environment.systemPackages = [ cfg.package ];
          };
        };
    };
}
