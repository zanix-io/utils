#!/bin/sh

######### LINT STAGED ############

# Get the staged files that are added, copied, or modified (only specified extensions).
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# Filter files for formatting and linting.
STAGED_FMT_FILES=$(echo "$STAGED_FILES" | grep -E '\.(ts|tsx|js|jsx|md|json)$')
STAGED_LINT_FILES=$(echo "$STAGED_FILES" | grep -E '\.(ts|tsx|js|jsx)$')

# If there are no staged files for formatting, exit the script.
if [ -z "$STAGED_FMT_FILES" ] && [ -z "$STAGED_LINT_FILES" ]; then
  echo "\033[0;33minfo[pre-commit]\033[0m: No staged files to format or lint."
  exit 0
fi

# Run formatting only on staged files that need it.
if [ -n "$STAGED_FMT_FILES" ]; then
  echo "\033[0;33minfo[pre-commit]\033[0m: Running formatting on staged files..."
  deno fmt $STAGED_FMT_FILES -- --allow-read
  if [ $? -ne 0 ]; then
    echo "\033[1;31merror[pre-commit]\033[0m: Formatting failed!"
    exit 1
  fi
fi

# Run linting only on staged files that need it.
if [ -n "$STAGED_LINT_FILES" ]; then
  echo "\033[0;33minfo[pre-commit]\033[0m: Running linting on staged files..."
  deno lint --fix $STAGED_LINT_FILES -- --allow-read --allow-write
  if [ $? -ne 0 ]; then
    echo "\033[1;31merror[pre-commit]\033[0m: Linting failed!"
    exit 1
  fi
fi

# If both formatting and linting passed without errors, re-add the files to the staging area.
echo "\033[0;32msuccess[pre-commit]\033[0m: Formatting and linting passed successfully. Re-adding the files to the staging area..."
git add $STAGED_FMT_FILES $STAGED_LINT_FILES
