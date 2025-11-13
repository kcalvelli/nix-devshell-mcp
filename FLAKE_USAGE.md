# Nix Flake Usage Guide

This document explains how to use the `nix-devshell-mcp` flake for running the MCP server and integrating it into NixOS configurations.

## Table of Contents

- [Quick Start](#quick-start)
- [Running with `nix run`](#running-with-nix-run)
- [Using as a Flake Input](#using-as-a-flake-input)
- [NixOS Integration](#nixos-integration)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- Nix with flakes enabled
- Git

### Enable Nix Flakes

If you haven't enabled flakes yet, add this to your `~/.config/nix/nix.conf` or `/etc/nix/nix.conf`:

```
experimental-features = nix-command flakes
```

---

## Running with `nix run`

You can run the MCP server directly without installing it:

```bash
# Run from the repository directory
nix run .#

# Or run from a Git URL
nix run github:kcalvelli/nix-devshell-mcp
```

The MCP server will start and communicate via stdio, ready to accept MCP protocol commands.

### Testing the Server

To test that the server is working:

```bash
# The server should start and wait for input
timeout 2 nix run .# 2>&1 | head -5
```

You should see output like:
```
[INFO] Starting nix-devshell-mcp server...
[INFO] Initializing DevshellTool...
[INFO] Loading profiles from: /nix/store/.../templates
[INFO] nix-devshell-mcp server started successfully
```

---

## Using as a Flake Input

You can use this flake as an input in your own flakes. This is useful for:
- Including the tool in your development environment
- Integrating with your NixOS configuration
- Building custom configurations that depend on this tool

### Example: Adding to Your Project's Flake

```nix
{
  description = "My project";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    nix-devshell-mcp.url = "github:kcalvelli/nix-devshell-mcp";
  };

  outputs = { self, nixpkgs, nix-devshell-mcp }: {
    # Use the package in your dev shell
    devShells.x86_64-linux.default = let
      pkgs = nixpkgs.legacyPackages.x86_64-linux;
    in pkgs.mkShell {
      buildInputs = [
        nix-devshell-mcp.packages.x86_64-linux.default
        # your other dependencies...
      ];
    };
  };
}
```

### Example: Local Development Flake Input

If you're developing locally and want to test changes:

```nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    nix-devshell-mcp.url = "path:/home/user/projects/nix-devshell-mcp";
  };
  # ... rest of your flake
}
```

---

## NixOS Integration

This flake provides a NixOS module for system-wide integration.

### Method 1: Using the Module Directly

Add to your `configuration.nix` or flake-based NixOS configuration:

```nix
{
  description = "My NixOS configuration";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    nix-devshell-mcp.url = "github:kcalvelli/nix-devshell-mcp";
  };

  outputs = { self, nixpkgs, nix-devshell-mcp }: {
    nixosConfigurations.myhost = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        # Import the NixOS module
        nix-devshell-mcp.nixosModules.default

        ({ pkgs, ... }: {
          # Enable the service
          services.nix-devshell-mcp.enable = true;

          # Optional: specify a different package version
          # services.nix-devshell-mcp.package = nix-devshell-mcp.packages.x86_64-linux.default;
        })
      ];
    };
  };
}
```

### Method 2: Installing System-Wide Without the Module

If you just want the binary available system-wide:

```nix
{
  description = "My NixOS configuration";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    nix-devshell-mcp.url = "github:kcalvelli/nix-devshell-mcp";
  };

  outputs = { self, nixpkgs, nix-devshell-mcp }: {
    nixosConfigurations.myhost = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        ({ pkgs, ... }: {
          environment.systemPackages = [
            nix-devshell-mcp.packages.x86_64-linux.default
          ];
        })
      ];
    };
  };
}
```

### Method 3: Home Manager Integration

For user-level installation via Home Manager:

```nix
{
  description = "My Home Manager configuration";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    home-manager.url = "github:nix-community/home-manager";
    nix-devshell-mcp.url = "github:kcalvelli/nix-devshell-mcp";
  };

  outputs = { self, nixpkgs, home-manager, nix-devshell-mcp }: {
    homeConfigurations."user@host" = home-manager.lib.homeManagerConfiguration {
      pkgs = nixpkgs.legacyPackages.x86_64-linux;
      modules = [
        ({ pkgs, ... }: {
          home.packages = [
            nix-devshell-mcp.packages.x86_64-linux.default
          ];
        })
      ];
    };
  };
}
```

---

## Development

### Enter the Development Shell

The flake provides a development shell with all necessary dependencies:

```bash
nix develop
```

This provides:
- Node.js
- npm
- TypeScript
- TypeScript Language Server

### Build Locally

```bash
# Enter dev shell
nix develop

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run the server in dev mode
npm run dev
```

### Build with Nix

To build the package with Nix:

```bash
nix build .#
```

The result will be in the `./result` symlink.

### Updating the npm Dependencies Hash

If you update `package.json` or `package-lock.json`, you'll need to update the `npmDepsHash` in `flake.nix`:

1. Change the hash to a dummy value:
   ```nix
   npmDepsHash = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
   ```

2. Try to build:
   ```bash
   nix build .#
   ```

3. Nix will fail and show you the correct hash. Copy it.

4. Update `flake.nix` with the correct hash.

5. Build again - it should succeed now.

---

## Flake Outputs

This flake provides several outputs:

### Packages

- `packages.<system>.default` - The main nix-devshell-mcp package
- `packages.<system>.nix-devshell-mcp` - Same as default

Example:
```bash
nix build .#nix-devshell-mcp
```

### Apps

- `apps.<system>.default` - Run the MCP server
- `apps.<system>.nix-devshell-mcp` - Same as default

Example:
```bash
nix run .#nix-devshell-mcp
```

### Development Shells

- `devShells.<system>.default` - Development environment

Example:
```bash
nix develop
```

### NixOS Modules

- `nixosModules.default` - NixOS module for system integration

---

## Troubleshooting

### Flake Not Found

If you get "flake not found" errors, ensure the repository is a Git repository and `flake.nix` is tracked:

```bash
git add flake.nix
git commit -m "Add flake.nix"
```

### Hash Mismatch

If you get a hash mismatch error:

```
error: hash mismatch in fixed-output derivation
```

Follow the "Updating the npm Dependencies Hash" section above.

### "Git tree is dirty" Warning

This warning appears when you have uncommitted changes. It's safe to ignore during development, but for reproducibility, commit your changes:

```bash
git add .
git commit -m "Update flake"
```

### MCP Server Not Starting

Check the logs:
```bash
nix run .# 2>&1 | less
```

Look for ERROR or WARN messages that indicate what went wrong.

### Missing Profiles

If you see "Loaded 0 profiles", it means the `profiles/` (or `templates/`) directory is empty. This is expected if you haven't created profile templates yet. See the project's `TEMPLATE_SPEC.md` for how to create profiles.

---

## Advanced Usage

### Cross-Compilation

Build for different systems:

```bash
# Build for macOS (from Linux)
nix build .#packages.aarch64-darwin.default

# Build for Linux ARM
nix build .#packages.aarch64-linux.default
```

### Pinning a Specific Version

In your flake inputs, you can pin to a specific commit or tag:

```nix
inputs = {
  nix-devshell-mcp.url = "github:kcalvelli/nix-devshell-mcp/v1.0.0";
  # or
  nix-devshell-mcp.url = "github:kcalvelli/nix-devshell-mcp?ref=main&rev=abc123...";
};
```

### Using with direnv

Create a `.envrc` file in your project:

```bash
use flake github:kcalvelli/nix-devshell-mcp
```

Then run:
```bash
direnv allow
```

Now the tool will be automatically available when you `cd` into the directory.

---

## Additional Resources

- [Nix Flakes Documentation](https://nixos.wiki/wiki/Flakes)
- [NixOS Manual](https://nixos.org/manual/nixos/stable/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Project README](README.md)
- [Implementation Plan](IMPLEMENTATION_PLAN.md)

---

## Support

For issues or questions:
1. Check the [project documentation](README.md)
2. Review this guide's [Troubleshooting](#troubleshooting) section
3. Open an issue on GitHub: https://github.com/kcalvelli/nix-devshell-mcp/issues

---

**Last Updated**: 2025-11-13
**Flake Version**: 1.0.0
