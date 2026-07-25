#!/usr/bin/env python3
import re
from datetime import datetime

def parse_time(value):
    text = str(value or "").lower().replace("–", "-").replace("—", "-").split("-", 1)[0].strip()
    match = re.search(r"(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)", text)
    if match:
        hour = int(match.group(1))
        minute = int(match.group(2) or 0)
        if match.group(3) == "pm" and hour != 12:
            hour += 12
        if match.group(3) == "am" and hour == 12:
            hour = 0
        return hour, minute
    match = re.search(r"(\d{1,2}):(\d{2})", text)
    if match:
        return int(match.group(1)), int(match.group(2))
    return 19, 30

def parse_start(record):
    day = datetime.strptime(record["date"], "%Y-%m-%d")
    hour, minute = parse_time(record.get("time"))
    return day.replace(hour=hour, minute=minute)

if __name__ == "__main__":
    print("Proms Calendar helper installed. BBC-style times are supported.")
