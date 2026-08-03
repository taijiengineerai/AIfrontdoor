import "dotenv/config";
import http from "http";
import { google } from "googleapis";

// One-time OAuth flow: run this once as the calendar owner to get a refresh
// token, then paste it into .env as GOOGLE_OAUTH_REFRESH_TOKEN. Run with:
// npm run setup:google-token

const REDIRECT_URI = "http://localhost:5555/oauth2callback";

async function main() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in .env first");
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar"],
  });

  console.log("\nOpen this URL, log in as the calendar owner, and approve access:\n");
  console.log(authUrl);
  console.log("\nWaiting for you to approve in the browser...");

  const code = await new Promise<string>((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? "", REDIRECT_URI);
      const authCode = url.searchParams.get("code");
      if (authCode) {
        res.end("Authorized - you can close this tab and return to the terminal.");
        server.close();
        resolve(authCode);
      } else {
        res.end("No authorization code received.");
      }
    });
    server.listen(5555);
  });

  const { tokens } = await oauth2Client.getToken(code);
  console.log("\nAdd this line to your .env file:\n");
  console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
