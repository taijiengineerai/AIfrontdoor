# AI Front Door

AI voice receptionist + booking system for residential HVAC/plumbing companies.
Phase 0 MVP: one Vapi assistant, one phone number, books into Google Calendar,
logs every call to Supabase.

## Architecture

- **Vapi** runs the actual phone call (speech-to-text, LLM, text-to-speech, phone number).
- **This server** implements the two things Vapi calls out to mid-call:
  - `check_availability` / `book_appointment` tool calls -> Google Calendar
  - end-of-call webhook -> logs the call/transcript/summary to Supabase
- **Supabase** stores clients, calls, and bookings.
- **Google Calendar** (via a service account) is the source of truth for availability/bookings.

## Setup

1. `npm install`
2. Copy `.env.example` values you have into `.env` (Vapi key is already filled in).
3. Create a Supabase project, run `db/schema.sql` in the SQL editor, copy the URL + service role key into `.env`.
4. Create a Google Cloud service account with the Calendar API enabled, download its JSON key to
   `google-service-account.json` in this folder, and share the target Google Calendar with the
   service account's email (Calendar settings -> Share with specific people).
5. In dev, expose this server publicly (Vapi needs to reach it): `npx ngrok http 3000`, then set
   `PUBLIC_SERVER_URL` in `.env` to the ngrok https URL.
6. Fill in the `CLIENT_CONFIG` block in `scripts/create-assistant.ts` with the pilot client's
   business details, then run `npm run setup:assistant` to create the Vapi assistant.
7. In the Vapi dashboard, assign a phone number to the new assistant (Phone Numbers tab).
8. `npm run dev` to start the local server, then call the number to test.

## Onboarding a new client (Phase 1)

Duplicate the `CLIENT_CONFIG` block in `scripts/create-assistant.ts` (or extend the script to
loop over clients from Supabase), fill in their business details, rerun `npm run setup:assistant`,
assign a number, and you're live.
