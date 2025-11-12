#!/usr/bin/env bash

set -euo pipefail

echo "Running post-creation setup for python-fastapi..."

# Initialize git repository if gitAutoInit is enabled
if [ "${GIT_AUTO_INIT:-true}" = "true" ]; then
  if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: Python FastAPI project setup

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
echo "  3. uvicorn app.main:app --reload"
echo "  4. Open http://localhost:8000/docs"
echo ""
