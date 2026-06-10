#!/bin/bash
# Hook yürütme zamanını ölçer

start_time=$(date +%s.%N)

run_command() {
  local cmd="$1"
  eval "$cmd"
  local exit_code=$?
  
  end_time=$(date +%s.%N)
  duration=$(echo "$end_time - $start_time" | bc)
  
  if [ $exit_code -eq 0 ]; then
    echo "TIME: ${duration}s" >&2
  fi
  
  return $exit_code
}

export -f run_command
export start_time
