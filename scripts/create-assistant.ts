import "dotenv/config";
import fs from "fs";
import path from "path";

// Creates (or updates) a Vapi assistant from vapi/assistant-config.json for one client,
// and provisions a Vapi phone number pointed at it. Run with: npm run setup:assistant
//
// Fill in the CLIENT_CONFIG below per client before running, or turn this into a
// CLI that reads from Supabase once you're onboarding client #2+.

const CLIENT_CONFIG = {
  business_name: "REPLACE_ME",
  service_area: "REPLACE_ME (e.g. Austin, TX and surrounding suburbs)",
  business_hours: "REPLACE_ME (e.g. Mon-Sat 7am-7pm, 24/7 emergency line)",
  services_list: "REPLACE_ME (e.g. AC repair, furnace repair, water heater install, drain cleaning)",
  pricing_notes: "REPLACE_ME (e.g. Diagnostic fee is $89, waived if repair is completed same visit)",
  callback_window: "1 hour",
};

async function main() {
  const vapiKey = process.env.VAPI_PRIVATE_KEY;
  const serverUrl = process.env.PUBLIC_SERVER_URL;
  if (!vapiKey) throw new Error("VAPI_PRIVATE_KEY not set in .env");
  if (!serverUrl) throw new Error("PUBLIC_SERVER_URL not set in .env (use ngrok/cloudflared in dev)");

  const raw = fs.readFileSync(path.join(__dirname, "../vapi/assistant-config.json"), "utf-8");
  let templated = raw.replace(/{{PUBLIC_SERVER_URL}}/g, serverUrl);
  for (const [key, value] of Object.entries(CLIENT_CONFIG)) {
    templated = templated.replaceAll(`{{${key}}}`, value);
  }
  const config = JSON.parse(templated);

  const res = await fetch("https://api.vapi.ai/assistant", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${vapiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config),
  });

  if (!res.ok) {
    console.error(await res.text());
    throw new Error(`Vapi API returned ${res.status}`);
  }

  const assistant = await res.json();
  console.log("Created assistant:", assistant.id);
  console.log("Next: buy/assign a Vapi phone number to this assistant in the Vapi dashboard (Phone Numbers tab), or via the /phone-number API.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
