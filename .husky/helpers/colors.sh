#!/bin/bash
# ANSI Renk kodları

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;37m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Functions
print_header() {
  echo -e "${BOLD}${BLUE}╔════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${BLUE}║${NC} $1"
  echo -e "${BOLD}${BLUE}╚════════════════════════════════════════╝${NC}"
}

print_step() {
  echo -e "${CYAN}▶ $1${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${MAGENTA}ℹ️  $1${NC}"
}

print_timer_start() {
  echo -e "${GRAY}⏱️  Başlangıç...${NC}"
}

print_timer_end() {
  echo -e "${GRAY}⏱️  Bitti: ${1}s${NC}"
}
