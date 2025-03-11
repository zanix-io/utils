#!/bin/sh

######### LINT STAGED ############

# Get the files that are staged for commit (only specified extensions).
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(FILE_EXTENSIONS)$')

# If there are no staged TS/JS files, exit the script.
if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

# Run the linter and fmt only on the staged files.
deno fmt $STAGED_FILES -- --allow-read
deno lint --fix $STAGED_FILES -- --allow-read --allow-write

# If the linter passes without errors, re-add the files to the staging area.
if [ $? -eq 0 ]; then
  echo "\033[0;32m[success]\033[0m: Linting passed successfully. Re-adding the files to the staging area..."
  git add $STAGED_FILES
else
  echo "\033[1;31m[error]\033[0m: Linting errors! No changes have been added to the staging area."
  exit 1
fi