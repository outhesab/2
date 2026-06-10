#!/bin/bash

LOG_DIR=".hook_cache"
mkdir -p "$LOG_DIR"

log_hook_time() {
  local hook_name="$1"
  local duration="$2"
  local status="$3"
  
  echo "$(date '+%Y-%m-%d %H:%M:%S') | $hook_name | ${duration}s | $status" >> "$LOG_DIR/hook_times.log"
}

get_hook_stats() {
  local hook_name="$1"
  
  if [ -f "$LOG_DIR/hook_times.log" ]; then
    grep "| $hook_name |" "$LOG_DIR/hook_times.log" | tail -10
  fi
}

export -f log_hook_time
export -f get_hook_stats
