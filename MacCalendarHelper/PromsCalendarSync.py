#!/usr/bin/env python3
from __future__ import annotations
import json
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

CALENDAR_NAME = "Proms"
SYNC_FILENAME = "PromsCalendarSync.json"
DURATION_HOURS = 3
CANDIDATES = [
    Path.home() / "Library/Mobile Documents/com~apple~CloudDocs/Proms" / SYNC_FILENAME,
    Path.home() / "Library/Mobile Documents/com~apple~CloudDocs" / SYNC_FILENAME,
    Path.home() / "Downloads" / SYNC_FILENAME,
    Path.home() / "Documents" / SYNC_FILENAME,
]
MONTHS = ["January","February","March","April","May","June",
          "July","August","September","October","November","December"]

def esc(value):
    return str(value or "").replace("\\", "\\\\").replace('"', '\\"').replace("\r", "").replace("\n", "\\n")

def osa(script):
    p = subprocess.run(["/usr/bin/osascript", "-e", script], capture_output=True, text=True)
    if p.returncode:
        raise RuntimeError(p.stderr.strip() or "AppleScript failed")
    return p.stdout.strip()

def find_file():
    for path in CANDIDATES:
        if path.exists():
            return path
    raise FileNotFoundError("PromsCalendarSync.json not found. Connect Mac Calendar in the app and save it in iCloud Drive/Proms.")

def ensure_calendar():
    script = 'tell application "Calendar"\n'
    script += f'if not (exists calendar "{esc(CALENDAR_NAME)}") then\n'
    script += f'make new calendar with properties {{name:"{esc(CALENDAR_NAME)}"}}\n'
    script += 'end if\nend tell'
    osa(script)

def make_notes(r):
    status = []
    if r.get("myProm"): status.append("My Prom")
    if r.get("hasTicket"): status.append("Ticket")
    seat = " · ".join(x for x in [
        r.get("area",""), r.get("section",""),
        f"Row {r.get('row')}" if r.get("row") else "",
        f"Seat {r.get('seat')}" if r.get("seat") else "",
    ] if x)
    return "\n".join([
        f"PROMS-LISTER-ID:{r['id']}",
        f"BBC Prom: {r.get('promNumber','')}",
        f"Status: {', '.join(status)}",
        f"Venue: {r.get('venue','')}",
        f"City: {r.get('city','')}",
        f"Seat: {seat}",
        f"Door: {r.get('door','')}",
        f"Reference: {r.get('reference','')}",
        "",
        "PROGRAMME",
        r.get("programme",""),
        "",
        "PERFORMERS",
        r.get("performers",""),
        "",
        "BROADCAST",
        r.get("broadcast",""),
        "",
        f"PRICE: {r.get('price','')}",
        "",
        "PERSONAL NOTES",
        r.get("notes",""),
    ])

def date_lines(name, dt):
    return "\n".join([
        f"set {name} to current date",
        f"set year of {name} to {dt.year}",
        f"set month of {name} to {MONTHS[dt.month-1]}",
        f"set day of {name} to {dt.day}",
        f"set hours of {name} to {dt.hour}",
        f"set minutes of {name} to {dt.minute}",
        f"set seconds of {name} to 0",
    ])

def upsert(record):
    start = datetime.fromisoformat(f"{record['date']}T{record.get('time') or '19:30'}")
    end = start + timedelta(hours=DURATION_HOURS)
    marker = f"PROMS-LISTER-ID:{record['id']}"
    number = record.get("promNumber")
    summary = f"Prom {number} — {record.get('title','')}" if number else record.get("title","Prom")
    script = 'tell application "Calendar"\n'
    script += f'tell calendar "{esc(CALENDAR_NAME)}"\n'
    script += f'set matchingEvents to every event whose description contains "{esc(marker)}"\n'
    script += date_lines("startDate", start) + "\n"
    script += date_lines("endDate", end) + "\n"
    script += 'if (count of matchingEvents) is 0 then\n'
    script += f'make new event with properties {{summary:"{esc(summary)}", start date:startDate, end date:endDate, location:"{esc(record.get("venue","Royal Albert Hall"))}", description:"{esc(make_notes(record))}"}}\n'
    script += 'else\n'
    script += 'set targetEvent to item 1 of matchingEvents\n'
    script += f'set summary of targetEvent to "{esc(summary)}"\n'
    script += 'set start date of targetEvent to startDate\n'
    script += 'set end date of targetEvent to endDate\n'
    script += f'set location of targetEvent to "{esc(record.get("venue","Royal Albert Hall"))}"\n'
    script += f'set description of targetEvent to "{esc(make_notes(record))}"\n'
    script += 'if (count of matchingEvents) > 1 then\n'
    script += 'repeat with i from (count of matchingEvents) to 2 by -1\n'
    script += 'delete item i of matchingEvents\n'
    script += 'end repeat\nend if\nend if\nend tell\nend tell'
    osa(script)

def main():
    payload = json.loads(find_file().read_text(encoding="utf-8"))
    selected = [r for r in payload.get("records", []) if r.get("myProm") or r.get("hasTicket")]
    ensure_calendar()
    for record in selected:
        upsert(record)
        print(f"Synced Prom {record.get('promNumber','?')}: {record.get('title','')}")
    print(f"Calendar sync complete: {len(selected)} event(s).")

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Proms Calendar Sync failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
