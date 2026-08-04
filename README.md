# AI Front Door

AI voice receptionist + booking system for residential HVAC/plumbing companies.
Phase 0 MVP: one Vapi assistant, one phone number, books into Google Calendar,
logs every call to Supabase.

## Architecture

- **Vapi** runs the actual phone call (speech-to-text, LLM, text-to-speech, phone number).
  Model is **GPT-4o** - `claude-sonnet-5` was tried first but reliably hung mid-call whenever
  it needed to invoke a tool (a Vapi-side integration issue, not our code); GPT-4o doesn't
  have this problem. Revisit if Vapi's Claude tool-calling integration stabilizes.
- **This server** implements the two things Vapi calls out to mid-call:
  - `book_appointment` tool call -> checks Google Calendar availability, then books if free
  - end-of-call webhook -> logs the call/transcript/summary to Supabase
- **Supabase** stores clients, calls, and bookings.
- **Google Calendar** (via OAuth, authenticated as the calendar owner) is the source of truth
  for availability/bookings. Google's service-account key creation is blocked by default org
  policy on most accounts now, so this uses a one-time OAuth flow instead
  (`npm run setup:google-token`).

### Known limitation: the assistant's prompt has a static "current date"

The system prompt bakes in today's date/time as plain text so the model can correctly compute
"tomorrow"/"next Monday" etc. - without this it silently guesses a stale date (this took down
a real test booking, see git history). That date goes stale after ~24h, so `create-assistant.ts`
needs to be rerun daily until this moves to per-call dynamic assistant resolution (Vapi supports
resolving the assistant config via a webhook per inbound call instead of a static assistantId,
which would let the server inject a fresh date every call - not yet implemented).

## Setup

1. `npm install`
2. Copy `.env.example` values you have into `.env` (Vapi key is already filled in).
3. Create a Supabase project, run `db/schema.sql` in the SQL editor, copy the URL + service role key into `.env`.
4. Google Calendar OAuth: create an OAuth Client ID (Web application type) in Google Cloud Console
   with redirect URI `http://localhost:5555/oauth2callback`, put the Client ID/Secret in `.env`,
   then run `npm run setup:google-token` - it opens a one-time browser approval as the calendar
   owner and prints a `GOOGLE_OAUTH_REFRESH_TOKEN` to add to `.env`.
5. In dev, expose this server publicly (Vapi needs to reach it): install `cloudflared`
   (`winget install Cloudflare.cloudflared`), run `cloudflared tunnel --url http://localhost:3000`,
   then set `PUBLIC_SERVER_URL` in `.env` to the printed `https://*.trycloudflare.com` URL.
   Note this URL changes every time the tunnel restarts, and the free quick-tunnel has no
   uptime guarantee - fine for testing, not for a real client.
6. Fill in the `CLIENT_CONFIG` block in `scripts/create-assistant.ts` with the pilot client's
   business details, then run `npm run setup:assistant` to create the Vapi assistant.
7. In the Vapi dashboard, assign a phone number to the new assistant (Phone Numbers tab).
8. `npm run dev` to start the local server, then call the number to test.

## Onboarding a new client (Phase 1)

Duplicate the `CLIENT_CONFIG` block in `scripts/create-assistant.ts` (or extend the script to
loop over clients from Supabase), fill in their business details, rerun `npm run setup:assistant`,
assign a number, and you're live.
