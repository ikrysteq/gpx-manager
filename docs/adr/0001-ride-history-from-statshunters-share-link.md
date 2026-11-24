# Ride History comes from the Statshunters share link, not the Strava API

Ride History (the user's Strava Activities drawn as a map layer) is read from the user's Statshunters share link: `https://statshunters.com/share/<hash>/api/activities?page=N` for Activity details and `.../api/activities/lines?page=N` for each Activity's encoded summary polyline, 500 per page. We chose this because, since June 2026, creating any Strava API application, even a single-player personal one, requires the developer to hold a paid Strava subscription. Statshunters already syncs the user's Strava account for free and has done the slow, rate-limited import. The price is a dependency on undocumented, unofficial endpoints that Statshunters may change or block at any time. The `lines` endpoint also only works when line sharing is enabled on the share link.

## Considered Options

- **Own Strava API app**: official and stable, but needs a paid subscription. Strava's API Policy also forbids keeping API data for more than 7 days, which would force a weekly full re-fetch.
- **Strava bulk export ZIP**: free and permanent, but a manual, always-stale upload.

## Consequences

The app reads Ride History through one "Ride History source" seam, so a Strava API source can be added later without touching the map or the Sync dialog. Activities with no line (indoor, virtual, trainer) are dropped.
