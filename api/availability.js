// /api/availability.js
// Server-side Google Calendar availability check.
// Uses a stored refresh token (set once in Vercel env vars) so the people
// using the booking app NEVER see a Google sign-in prompt — same idea as
// how Calendly checks your calendar in the background.

export default async function handler(req, res) {
  try {
    const { calendarIds, timeMin, timeMax } = req.query;

    if (!calendarIds || !timeMin || !timeMax) {
      return res.status(400).json({ error: "Missing calendarIds, timeMin, or timeMax query params" });
    }

    const ids = String(calendarIds).split(",").filter(Boolean);

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
      return res.status(500).json({ error: "Failed to refresh Google access token" });
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch events for every requested calendar in parallel.
    const results = await Promise.allSettled(
      ids.map(async (calendarId) => {
        const url = new URL(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
        );
        url.searchParams.set("timeMin", String(timeMin));
        url.searchParams.set("timeMax", String(timeMax));
        url.searchParams.set("singleEvents", "true");
        url.searchParams.set("maxResults", "2500");

        const r = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!r.ok) throw new Error(`Calendar ${calendarId} returned ${r.status}`);
        const data = await r.json();
        return data.items || [];
      })
    );

    const events = [];
    results.forEach((r) => {
      if (r.status === "fulfilled") events.push(...r.value);
      else console.error("Calendar fetch failed:", r.reason);
    });

    // Don't let Vercel/browser cache stale availability.
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ events });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Unknown error" });
  }
}
