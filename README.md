# Activity Weather Ranker

A backend service that ranks how good the next 7 days will be for skiing, surfing, outdoor sightseeing, and indoor sightseeing — based on weather data from [Open-Meteo](https://open-meteo.com/).

## Assumptions

- No authentication required.
- "Persist" means cache with a TTL (default 3 hours), not a permanent historical archive.
- Will use Open-Meteo's geocoding API; to get lat/lon.
- Wind speed is used as a proxy for surf/wave conditions — Open-Meteo's free tier does not provide swell data. A real implementation would use a marine API.
- Scoring weights are opinionated.
- Cache is considered fresh if all 7 future days are present and `fetched_at` is within the TTL window.

## Design Decisions

### Storage: PostgreSQL
Structured, date-indexed data fits a relational model naturally. A `(city_id, date)` unique constraint enables clean upsert semantics on re-fetch.

### Caching
Forecasts are cached with a `fetched_at` timestamp and refreshed on the next request if older than 3 hours. A background refresh job would be a natural next step.

### Scoring (1–10 per activity per day)

