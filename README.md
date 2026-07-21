# Proms Lister — Internet Sync Edition

This package replaces ZIP transfer with secure internet synchronisation through a Supabase Edge Function.

## Setup

1. Create a free Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL Editor.
3. Deploy the function:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy proms-sync --no-verify-jwt
```

4. Publish the website files to GitHub Pages.
5. In the app press **Connect internet sync** and enter:
   - `https://YOUR_PROJECT_REF.supabase.co/functions/v1/proms-sync`
   - a shared Sync ID
   - a long shared Sync Key
6. Enter the same values on the phone and desktop.

Ticket details and attached PDFs/photos synchronise automatically. The app still works offline.
