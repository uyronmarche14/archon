#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FAILURES=0
WARNINGS=0

info() {
  printf '[INFO] %s\n' "$1"
}

ok() {
  printf '[OK] %s\n' "$1"
}

warn() {
  printf '[WARN] %s\n' "$1"
  WARNINGS=$((WARNINGS + 1))
}

fail() {
  printf '[FAIL] %s\n' "$1"
  FAILURES=$((FAILURES + 1))
}

require_file() {
  local path="$1"

  if [ -f "$ROOT_DIR/$path" ]; then
    ok "Found file: $path"
  else
    fail "Missing required file: $path"
  fi
}

require_dir() {
  local path="$1"

  if [ -d "$ROOT_DIR/$path" ]; then
    ok "Found directory: $path"
  else
    fail "Missing required directory: $path"
  fi
}

validate_codemap() {
  local path="$1"

  require_file "$path"

  if ! grep -q '^Last Updated:' "$ROOT_DIR/$path"; then
    fail "Codemap missing Last Updated header: $path"
  fi

  if ! grep -q '^Status:' "$ROOT_DIR/$path"; then
    fail "Codemap missing Status header: $path"
  fi

  if ! grep -q '^Entry Points:' "$ROOT_DIR/$path"; then
    fail "Codemap missing Entry Points header: $path"
  fi

  if ! grep -q '^Planned vs Implemented:' "$ROOT_DIR/$path"; then
    fail "Codemap missing Planned vs Implemented header: $path"
  fi
}

detect_package_manager() {
  local workspace="$1"

  if [ -f "$workspace/pnpm-lock.yaml" ]; then
    printf 'pnpm'
  elif [ -f "$workspace/yarn.lock" ]; then
    printf 'yarn'
  else
    printf 'npm'
  fi
}

has_script() {
  local workspace="$1"
  local script_name="$2"

  grep -q "\"$script_name\"[[:space:]]*:" "$workspace/package.json"
}

run_package_script() {
  local workspace="$1"
  local label="$2"
  local package_manager="$3"
  local script_name="$4"

  if ! command -v "$package_manager" >/dev/null 2>&1; then
    fail "$label: package manager '$package_manager' is not installed"
    return
  fi

  info "$label: running '$script_name' via $package_manager"

  case "$package_manager" in
    pnpm)
      if ! (cd "$workspace" && pnpm "$script_name"); then
        fail "$label: '$script_name' failed"
      fi
      ;;
    yarn)
      if ! (cd "$workspace" && yarn "$script_name"); then
        fail "$label: '$script_name' failed"
      fi
      ;;
    npm)
      if ! (cd "$workspace" && npm run "$script_name"); then
        fail "$label: '$script_name' failed"
      fi
      ;;
    *)
      fail "$label: unsupported package manager '$package_manager'"
      ;;
  esac
}

run_workspace_checks() {
  local relative_path="$1"
  local label="$2"
  local workspace="$ROOT_DIR/$relative_path"
  local package_manager

  if [ ! -f "$workspace/package.json" ]; then
    warn "$label: skipped runtime checks until $relative_path/package.json exists"
    return
  fi

  ok "$label: found package manifest"
  package_manager="$(detect_package_manager "$workspace")"

  for script_name in lint typecheck test build; do
    if has_script "$workspace" "$script_name"; then
      run_package_script "$workspace" "$label" "$package_manager" "$script_name"
    else
      warn "$label: skipped '$script_name' because it is not defined"
    fi
  done
}

info "Running DOWINN quality gate from $ROOT_DIR"

for required_dir in \
  ".codex" \
  ".codex/agents" \
  "scripts" \
  "docs" \
  "docs/CODEMAPS" \
  "frontend" \
  "frontend/public" \
  "frontend/src" \
  "frontend/src/app" \
  "frontend/src/components" \
  "frontend/src/components/shared" \
  "frontend/src/components/ui" \
  "frontend/src/contracts" \
  "frontend/src/features" \
  "frontend/src/features/auth" \
  "frontend/src/features/projects" \
  "frontend/src/features/tasks" \
  "frontend/src/lib" \
  "frontend/src/providers" \
  "frontend/src/services" \
  "frontend/src/services/http" \
  "frontend/src/styles" \
  "backend" \
  "backend/src" \
  "backend/src/common" \
  "backend/src/config" \
  "backend/src/database" \
  "backend/src/modules" \
  "backend/src/modules/auth" \
  "backend/src/modules/users" \
  "backend/src/modules/projects" \
  "backend/src/modules/tasks" \
  "backend/src/modules/task-logs" \
  "backend/src/modules/seed" \
  "backend/src/modules/health" \
  "backend/prisma" \
  "backend/test" \
  "shared" \
  "shared/contracts" \
  "shared/enums" \
  "infra" \
  "infra/docker" \
  "infra/scripts"; do
  require_dir "$required_dir"
done

for required_file in \
  "README.md" \
  "AGENTS.md" \
  ".codex/config.toml" \
  ".codex/agents/planner.toml" \
  ".codex/agents/reviewer.toml" \
  ".codex/agents/docs-researcher.toml" \
  "scripts/quality-gate.sh" \
  "docs/README.md" \
  "docs/PRD.md" \
  "docs/ARCHITECTURE.md" \
  "docs/API.md" \
  "docs/CONTRACT-RULES.md" \
  "docs/STANDARDS.md" \
  "docs/MODULE-TEMPLATE.md" \
  "docs/FRONTEND-PLAN.md" \
  "docs/BACKEND-PLAN.md" \
  "docs/DEPLOYMENT.md" \
  "docs/AGENTS.md" \
  "docs/CODEMAPS/INDEX.md" \
  "docs/CODEMAPS/repo.md" \
  "docs/CODEMAPS/frontend.md" \
  "docs/CODEMAPS/backend.md" \
  "docs/CODEMAPS/contracts.md" \
  "docs/CODEMAPS/workflow.md" \
  "frontend/.env.example" \
  "frontend/README.md" \
  "frontend/src/README.md" \
  "frontend/src/services/http/README.md" \
  "backend/.env.example" \
  "backend/README.md" \
  "backend/prisma/README.md" \
  "backend/src/README.md" \
  "backend/test/README.md" \
  "infra/.env.example" \
  "infra/README.md" \
  "shared/README.md"; do
  require_file "$required_file"
done

for codemap in \
  "docs/CODEMAPS/INDEX.md" \
  "docs/CODEMAPS/repo.md" \
  "docs/CODEMAPS/frontend.md" \
  "docs/CODEMAPS/backend.md" \
  "docs/CODEMAPS/contracts.md" \
  "docs/CODEMAPS/workflow.md"; do
  validate_codemap "$codemap"
done

if [ -d "$ROOT_DIR/frontend-guide" ] || [ -d "$ROOT_DIR/backend-guide" ]; then
  warn "Legacy guide directories detected. Canonical implementation belongs in frontend/ and backend/."
fi

run_workspace_checks "frontend" "frontend"
run_workspace_checks "backend" "backend"

if [ "$FAILURES" -gt 0 ]; then
  printf '[FAIL] Quality gate failed with %s error(s) and %s warning(s)\n' "$FAILURES" "$WARNINGS"
  exit 1
fi

printf '[OK] Quality gate passed with %s warning(s)\n' "$WARNINGS"
