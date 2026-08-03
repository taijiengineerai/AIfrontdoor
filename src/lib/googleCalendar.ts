import { google } from "googleapis";
import path from "path";

const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH ?? "./google-service-account.json";
const calendarId = process.env.GOOGLE_CALENDAR_ID ?? "primary";

const auth = new google.auth.GoogleAuth({
  keyFile: path.resolve(keyPath),
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

const calendar = google.calendar({ version: "v3", auth });

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
