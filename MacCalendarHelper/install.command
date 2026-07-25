#!/bin/zsh
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
/usr/bin/python3 "$SCRIPT_DIR/PromsCalendarSync.py"
read -k 1 "?Press any key to close."
