Proms Lister — Ticket Seat Data + Mac Calendar

WHAT THIS BUILD ADDS
- Royal Albert Hall ticket PDFs are read using both text and PDF layout positions.
- Door, Section, Row and Seat are stored separately and shown in Proms Lister.
- The supplied test ticket (143446017.pdf) is expected to read as:
    Door: 9
    Section: Stalls O
    Row: 1
    Seat: 105
- Importing/attaching a ticket marks the concert as having a ticket and immediately updates the Calendar sync data.
- Mac Calendar event location now includes the seat information for quick display, e.g.
    Royal Albert Hall · Door 9 · Stalls O · Row 1 · Seat 105
- Calendar notes also contain separate Door / Section / Row / Seat fields.
- The ticket PDF is copied into an iCloud sync folder and the Calendar event URL points directly to that ticket file.

IMPORTANT MAC CALENDAR DETAIL
Apple Calendar's AppleScript interface does not expose native event attachments. This build therefore gives the Calendar event a direct file URL to the copied ticket PDF. In practice the ticket is available from the event with one click, while the actual PDF remains in the selected iCloud Drive/Proms/Tickets folder.

SETUP / UPGRADE
1. Replace the website index.html with the supplied index.html and push it to your normal web host/GitHub Pages.
2. Open Proms Lister in Chrome on the Mac.
3. Press Connect Mac Calendar.
4. Choose or create an iCloud Drive/Proms folder. The app creates:
      PromsCalendarSync.json
      Tickets/
5. Open MacCalendarHelper and run install.command.
6. Allow Calendar access when macOS asks.
7. Import or attach a Royal Albert Hall ticket PDF. The seat data is stored in the app and the sync files are updated immediately.

The helper runs every five minutes.
It uses PROMS-LISTER-ID in event notes to update existing events and remove duplicates.
Older single-file Calendar connections are still read, but reconnect to a folder once to enable ticket-file links.
