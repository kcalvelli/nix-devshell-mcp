#!/usr/bin/env bash

set -euo pipefail

echo "Running post-creation setup for java-spring-boot..."

# Initialize git repository if gitAutoInit is enabled
if [ "${GIT_AUTO_INIT:-true}" = "true" ]; then
  if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: Java Spring Boot project setup

Generated with nix-devshell-mcp"
    echo "✓ Git repository initialized"
  fi
fi

echo ""
echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. cd ${PROJECT_PATH}"
echo "  2. direnv allow"
echo "  3. mvn spring-boot:run"
echo "  4. Open http://localhost:8080"
echo ""
