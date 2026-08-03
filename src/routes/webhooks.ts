import { supabase } from "../lib/supabase";

export async function handleEndOfCallReport(message: any) {
  const call = message.call ?? {};
  const analysis = message.analysis ?? {};

  const { error } = await supabase.from("calls").insert({
    vapi_call_id: call.id,
    client_id: call.assistantId ?? null,
    from_number: call.customer?.number ?? null,
    started_at: message.startedAt ?? null,
    ended_at: message.endedAt ?? null,
    duration_seconds: message.durationSeconds ?? null,
    ended_reason: message.endedReason ?? null,
    transcript: message.transcript ?? null,
    summary: analysis.summary ?? null,
    successful: analysis.successEvaluation ?? null,
    recording_url: message.recordingUrl ?? null,
  });

  if (error) {
    console.error("[webhooks] failed to log call:", error.message);
  }
}
