# EXCELLENT UI Refresh

Base: uploaded **EXCELLENT Proms-Lister** build.

This build preserves the established ticket selection/reading code and adds the requested UI changes:

- Home banner centred: **BBC Proms 2026 Concert Diary**.
- Home **Menu** contains Import & Transfer and Calendar.
- **My Prom** is renamed **Promming** in the concert editor.
- Promming concerts display a green **Arena** indicator.
- Area and Reference inputs/displays removed (legacy values retained internally for compatibility).
- External SeatPlan/RAH website links removed; only the internal RAH seating plan remains.
- Concert **Menu** contains Save Ticket, Attach Ticket, Remove Ticket and Read Seat Details.
- Door/Section/Row/Seat fields are hidden when there is no ticket and hidden for Arena/Promming.
- Closing the internal RAH seating plan also closes/clears the Ticket Correction UI.
- Service-worker cache revision advanced so the UI refresh replaces older cached pages.

The multi-ticket page-selection/read order in `index.html` remains: select the correct ticket page first, then parse that selected page.
