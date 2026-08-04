import "dotenv/config";
import express from "express";
import cors from "cors";
import { runToolCall } from "./routes/tools";
import { handleEndOfCallReport } from "./routes/webhooks";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Single Server URL configured on the Vapi assistant — Vapi posts every
// call event (tool calls, end-of-call report, etc.) here as { message: {...} }
app.post("/vapi/webhook", async (req, res) => {
  const message = req.body?.message;
  console.log(`[webhook] received type=${message?.type ?? "unknown"} at ${new Date().toISOString()}`);
  if (!message) return res.status(400).json({ error: "missing message" });

  switch (message.type) {
    case "tool-calls": {
      console.log("[webhook] tool-calls:", JSON.stringify(message.toolCalls?.map((tc: any) => tc.function?.name)));
      const results = await Promise.all(
        (message.toolCalls ?? []).map((tc: any) => runToolCall(tc))
      );
      console.log("[webhook] tool-calls results:", JSON.stringify(results));
      return res.json({ results });
    }
    case "end-of-call-report":
      await handleEndOfCallReport(message);
      return res.json({ received: true });
    default:
      return res.json({ received: true });
  }
});

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`AI Front Door server listening on :${port}`);
});
