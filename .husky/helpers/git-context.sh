#!/bin/bash

# Commit'in hangi branch'ta yapıldığını öğren
get_current_branch() {
  git rev-parse --abbrev-ref HEAD
}

# Commit türü (WIP, regular, hotfix vs)
get_commit_type() {
  local msg="$1"
  if [[ "$msg" =~ ^(feat|fix|chore|docs|style|refactor|test|perf|ci) ]]; then
    echo "conventional"
  elif [[ "$msg" =~ ^WIP ]]; then
    echo "wip"
  elif [[ "$msg" =~ ^Merge ]]; then
    echo "merge"
  else
    echo "custom"
  fi
}

# Protected branches kontrol
is_protected_branch() {
  local branch="$1"
  [[ "$branch" == "main" ]] || [[ "$branch" == "master" ]] || [[ "$branch" == "production" ]]
}

export -f get_current_branch
export -f get_commit_type
export -f is_protected_branch
