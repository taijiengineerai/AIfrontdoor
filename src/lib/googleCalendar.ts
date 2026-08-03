import { google } from "googleapis";

const calendarId = process.env.GOOGLE_CALENDAR_ID ?? "primary";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN });

const calendar = google.calendar({ version: "v3", auth: oauth2Client });

export async function findFreeSlots(startIso: string, endIso: string) {
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: startIso,
      timeMax: endIso,
      items: [{ id: calendarId }],
    },
  });
  return res.data.calendars?.[calendarId]?.busy ?? [];
}

export async function bookAppointment(opts: {
  summary: string;
  description: string;
  startIso: string;
  endIso: string;
  customerPhone: string;
}) {
  const event = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: opts.summary,
      description: `${opts.description}\n\nCustomer phone: ${opts.customerPhone}\nBooked by AI receptionist.`,
      start: { dateTime: opts.startIso },
      end: { dateTime: opts.endIso },
    },
  });
  return event.data;
}
