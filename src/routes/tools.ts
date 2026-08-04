import { findFreeSlots, bookAppointment } from "../lib/googleCalendar";

type ToolCall = {
  id: string;
  function: { name: string; arguments: Record<string, any> };
};

async function handleBookAppointment(args: Record<string, any>) {
  const busy = await findFreeSlots(args.startIso, args.endIso);
  if (busy.length > 0) {
    return { booked: false, conflict: true, message: "That time is already booked, ask the caller for a different time." };
  }
  const event = await bookAppointment({
    summary: args.summary ?? "Service call",
    description: args.description ?? "",
    startIso: args.startIso,
    endIso: args.endIso,
    customerPhone: args.customerPhone ?? "unknown",
  });
  return { booked: true, eventId: event.id, htmlLink: event.htmlLink };
}

export async function runToolCall(toolCall: ToolCall) {
  const { name, arguments: args } = toolCall.function;
  try {
    switch (name) {
      case "book_appointment":
        return { toolCallId: toolCall.id, result: JSON.stringify(await handleBookAppointment(args)) };
      default:
        return { toolCallId: toolCall.id, result: JSON.stringify({ error: `Unknown tool: ${name}` }) };
    }
  } catch (err: any) {
    return { toolCallId: toolCall.id, result: JSON.stringify({ error: err.message ?? "Tool call failed" }) };
  }
}
