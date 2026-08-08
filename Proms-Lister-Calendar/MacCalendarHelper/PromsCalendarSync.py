#!/usr/bin/env python3
from __future__ import annotations
import json
import re
import shutil
import subprocess
import sys
import zipfile
from datetime import datetime, timedelta
from pathlib import Path

CALENDAR_NAME = "Proms"
SYNC_FILENAME = "PromsCalendarSync.json"
SYNC_ZIPNAME = "PromsCalendarSync.zip"
DURATION_HOURS = 3
ICLOUD = Path.home() / "Library/Mobile Documents/com~apple~CloudDocs"
CANDIDATES = [
    ICLOUD / "Proms" / SYNC_FILENAME,
    ICLOUD / SYNC_FILENAME,
    Path.home() / "Downloads" / SYNC_FILENAME,
    Path.home() / "Documents" / SYNC_FILENAME,
]
ZIP_CANDIDATES = [
    ICLOUD / "Proms" / SYNC_ZIPNAME,
    ICLOUD / SYNC_ZIPNAME,
    Path.home() / "Downloads" / SYNC_ZIPNAME,
]
SAFARI_IMPORT_DIR = Path.home() / "Library/Application Support/PromsCalendarSync/SafariImport"
MONTHS = ["January","February","March","April","May","June",
          "July","August","September","October","November","December"]

def esc(value):
    return str(value or "").replace("\\", "\\\\").replace('"', '\\"').replace("\r", "").replace("\n", "\\n")

def osa(script):
    p = subprocess.run(["/usr/bin/osascript", "-e", script], capture_output=True, text=True)
    if p.returncode:
        raise RuntimeError(p.stderr.strip() or "AppleScript failed")
    return p.stdout.strip()

def safe_extract_zip(zip_path: Path) -> Path:
    SAFARI_IMPORT_DIR.mkdir(parents=True, exist_ok=True)
    marker = SAFARI_IMPORT_DIR / ".source_mtime_ns"
    stamp = str(zip_path.stat().st_mtime_ns)
    if marker.exists() and marker.read_text(errors="ignore").strip() == stamp:
        candidate = SAFARI_IMPORT_DIR / SYNC_FILENAME
        if candidate.exists():
            return candidate
    for child in SAFARI_IMPORT_DIR.iterdir():
        if child.name == ".source_mtime_ns":
            continue
        if child.is_dir():
            shutil.rmtree(child)
        else:
            child.unlink()
    root = SAFARI_IMPORT_DIR.resolve()
    with zipfile.ZipFile(zip_path) as zf:
        for member in zf.infolist():
            target = (SAFARI_IMPORT_DIR / member.filename).resolve()
            if root != target and root not in target.parents:
                raise RuntimeError(f"Unsafe path in {zip_path.name}: {member.filename}")
        zf.extractall(SAFARI_IMPORT_DIR)
    marker.write_text(stamp)
    candidate = SAFARI_IMPORT_DIR / SYNC_FILENAME
    if not candidate.exists():
        raise FileNotFoundError(f"{SYNC_FILENAME} missing from {zip_path}")
    return candidate

def find_file():
    sources = []
    for path in CANDIDATES:
        if path.exists():
            sources.append((path.stat().st_mtime_ns, path, f"JSON {path}"))
    for path in ZIP_CANDIDATES:
        if path.exists():
            extracted = safe_extract_zip(path)
            sources.append((path.stat().st_mtime_ns, extracted, f"Safari ZIP {path}"))
    if not sources:
        raise FileNotFoundError(
            "PromsCalendarSync.json or PromsCalendarSync.zip not found. "
            "In Chrome connect the iCloud Drive/Proms folder; in Safari use Calendar export / Safari."
        )
    _, result, label = max(sources, key=lambda x: x[0])
    print(f"Using {label}")
    return result

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
    return "\n".join([
        f"PROMS-LISTER-ID:{r['id']}", f"BBC Prom: {r.get('promNumber','')}",
        f"Status: {', '.join(status)}", f"Venue: {r.get('venue','')}", f"City: {r.get('city','')}",
        f"Door: {r.get('door','')}", f"Section: {r.get('section') or r.get('area','')}", f"Row: {r.get('row','')}",
        f"Seat: {r.get('seat','')}", f"Reference: {r.get('reference','')}", f"Ticket file: {r.get('ticketFile','')}",
        "", "PROGRAMME", r.get("programme",""), "", "PERFORMERS", r.get("performers",""), "", "BROADCAST",
        r.get("broadcast",""), "", f"PRICE: {r.get('price','')}", "", "PERSONAL NOTES", r.get("notes","")])

def date_lines(name, dt):
    return "\n".join([f"set {name} to current date",f"set year of {name} to {dt.year}",f"set month of {name} to {MONTHS[dt.month-1]}",f"set day of {name} to {dt.day}",f"set hours of {name} to {dt.hour}",f"set minutes of {name} to {dt.minute}",f"set seconds of {name} to 0"])

def parse_time(t):
    if not t:return (19,30)
    t=str(t).lower().split("–")[0].split("-")[0].replace("c","").replace(".",":")
    m=re.search(r'(\d{1,2})(?::(\d{2}))?\s*pm',t)
    if m:
        h=int(m.group(1));h=h+12 if h<12 else h;return(h,int(m.group(2) or 0))
    m=re.search(r'(\d{1,2})(?::(\d{2}))?\s*am',t)
    if m:
        h=int(m.group(1));h=0 if h==12 else h;return(h,int(m.group(2) or 0))
    m=re.search(r'(\d{1,2}):(\d{2})',t)
    if m:return(int(m.group(1)),int(m.group(2)))
    return(19,30)

def upsert(record,sync_path):
    hour,minute=parse_time(record.get("time"));start=datetime.fromisoformat(record["date"]).replace(hour=hour,minute=minute);end=start+timedelta(hours=DURATION_HOURS)
    marker=f"PROMS-LISTER-ID:{record['id']}";number=record.get("promNumber");summary=f"Prom {number} — {record.get('title','')}" if number else record.get("title","Prom")
    seat_parts=[f"Door {record.get('door')}" if record.get("door") else "",record.get("section") or record.get("area", ""),f"Row {record.get('row')}" if record.get("row") else "",f"Seat {record.get('seat')}" if record.get("seat") else ""]
    location=" · ".join([record.get("venue","Royal Albert Hall")]+[x for x in seat_parts if x]);ticket_rel=str(record.get("ticketFile") or "").strip();ticket_url=""
    if ticket_rel:
        ticket_path=(sync_path.parent/ticket_rel).expanduser().resolve()
        if ticket_path.exists():ticket_url=ticket_path.as_uri()
    script='tell application "Calendar"\n';script+=f'tell calendar "{esc(CALENDAR_NAME)}"\n';script+=f'set matchingEvents to every event whose description contains "{esc(marker)}"\n';script+=date_lines("startDate",start)+"\n";script+=date_lines("endDate",end)+"\n";script+='if (count of matchingEvents) is 0 then\n';script+=f'make new event with properties {{summary:"{esc(summary)}", start date:startDate, end date:endDate, location:"{esc(location)}", description:"{esc(make_notes(record))}", url:"{esc(ticket_url)}"}}\n';script+='else\n';script+='set targetEvent to item 1 of matchingEvents\n';script+=f'set summary of targetEvent to "{esc(summary)}"\n';script+='set start date of targetEvent to startDate\n';script+='set end date of targetEvent to endDate\n';script+=f'set location of targetEvent to "{esc(location)}"\n';script+=f'set description of targetEvent to "{esc(make_notes(record))}"\n';script+=f'set url of targetEvent to "{esc(ticket_url)}"\n';script+='if (count of matchingEvents) > 1 then\n';script+='repeat with i from (count of matchingEvents) to 2 by -1\n';script+='delete item i of matchingEvents\n';script+='end repeat\nend if\nend if\nend tell\nend tell';osa(script)

def main():
    sync_path=find_file();payload=json.loads(sync_path.read_text(encoding="utf-8"));selected=[r for r in payload.get("records",[]) if r.get("myProm") or r.get("hasTicket")];ensure_calendar()
    for record in selected:upsert(record,sync_path);print(f"Synced Prom {record.get('promNumber','?')}: {record.get('title','')}")
    print(f"Calendar sync complete: {len(selected)} event(s).")

if __name__=="__main__":
    try:main()
    except Exception as exc:print(f"Proms Calendar Sync failed: {exc}",file=sys.stderr);raise SystemExit(1)
