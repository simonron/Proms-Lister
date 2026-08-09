#!/bin/zsh
set -e
HERE="${0:A:h}"
sudo mkdir -p /Applications/PromsCalendarSync
sudo cp "$HERE/PromsCalendarSync.py" /Applications/PromsCalendarSync/
sudo chmod 755 /Applications/PromsCalendarSync/PromsCalendarSync.py
mkdir -p "$HOME/Library/LaunchAgents"
cp "$HERE/com.simon.promscalendarsync.plist" "$HOME/Library/LaunchAgents/"
launchctl bootout "gui/$(id -u)" "$HOME/Library/LaunchAgents/com.simon.promscalendarsync.plist" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$HOME/Library/LaunchAgents/com.simon.promscalendarsync.plist"
launchctl kickstart -k "gui/$(id -u)/com.simon.promscalendarsync"
echo "Installed. Calendar sync runs every five minutes."
