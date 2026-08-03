import { findFreeSlots, bookAppointment } from "../lib/googleCalendar";

type ToolCall = {
  id: string;
  function: { name: string; arguments: Record<string, any> };
};

async function handleCheckAvailability(args: Record<string, any>) {
  const busy = await findFreeSlots(args.startIso, args.endIso);
  return busy.length === 0
    ? { available: true }
    : { available: false, busyRanges: busy };
}

async function handleBookAppointment(args: Record<string, any>) {
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
      case "check_availability":
        return { toolCallId: toolCall.id, result: JSON.stringify(await handleCheckAvailability(args)) };
      case "book_appointment":
        return { toolCallId: toolCall.id, result: JSON.stringify(await handleBookAppointment(args)) };
      default:
        return { toolCallId: toolCall.id, result: JSON.stringify({ error: `Unknown tool: ${name}` }) };
    }
  } catch (err: any) {
    return { toolCallId: toolCall.id, result: JSON.stringify({ error: err.message ?? "Tool call failed" }) };
  }
}
