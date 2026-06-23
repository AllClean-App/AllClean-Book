// /api/create-booking.js
// Server-side Google Calendar event creation.
// Uses the same stored refresh token as /api/availability.js, but that token must have
// full read/write scope (https://www.googleapis.com/auth/calendar), not calendar.readonly,
// or this will fail with a permission error from Google.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { calendarIds, event } = req.body || {};

    if (!Array.isArray(calendarIds) || calendarIds.length === 0 || !event) {
      return res.status(400).json({ error: "Missing calendarIds or event in request body" });
    }

    // 1. Trade the long-lived refresh token for a short-lived access token.
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        grant_type: "refresh_token",
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("Token refresh failed:", tokenData);
      return res.status(500).json({
        error: `Failed to refresh Google access token: ${tokenData.error_description || tokenData.error || "unknown reason"}`,
      });
    }

    const accessToken = tokenData.access_token;

    // 2. Insert the event into every relevant calendar in parallel.
    const results = await Promise.allSettled(
      calendarIds.map(async (calendarId) => {
        const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
        const r = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        });
        if (!r.ok) {
          const errBody = await r.text();
          throw new Error(`Calendar ${calendarId} returned ${r.status}: ${errBody}`);
        }
        return r.json();
      })
    );

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      failed.forEach((f) => console.error("Calendar insert failed:", f.reason));
      const reasons = failed.map((f) => (f.reason && f.reason.message) ? f.reason.message : String(f.reason));
      return res.status(500).json({
        error: `${failed.length} of ${calendarIds.length} calendar(s) failed: ${reasons.join(" | ")}`,
      });
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Unknown error" });
  }
}
