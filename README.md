# Activity Weather Ranker

A backend service that ranks how good the next 7 days will be for skiing, surfing, outdoor sightseeing, and indoor sightseeing — based on weather data from [Open-Meteo](https://open-meteo.com/).

## Quick Start

```bash
docker compose up -d
npm install
npm run db:migrate
npm run dev
```

Run tests:
```bash
npm test
```

Server starts at `http://localhost:4000` (Apollo Sandbox).

## Example Query

```graphql
query {
  rankActivities(city: "Chamonix") {
    city
    days {
      date
      scores {
        activity
        score
      }
    }
  }
}
```

## Assumptions

- No authentication required.
- "Persist" means cache with a TTL (default 3 hours), not a permanent historical archive.
- Uses Open-Meteo's geocoding API to resolve city name to lat/lon.
- Wind speed is used as a proxy for surf/wave conditions — Open-Meteo's free tier does not provide swell data. A real implementation would use a marine API.
- Scoring weights are opinionated and would normally be validated with product/domain experts.
- A city name is stored lowercased for consistent cache lookups.
- Cache is considered fresh if all 7 future days are present and `fetched_at` is within the TTL window.
- `CACHE_TTL_HOURS` defaults to 3 but is configurable via `.env`.

## Design Decisions

### Storage: PostgreSQL
Structured, date-indexed data fits a relational model naturally. A `(city_id, date)` unique constraint enables clean upsert semantics on re-fetch.

### Caching
Forecasts are cached with a `fetched_at` timestamp and refreshed on the next request if older than `CACHE_TTL_HOURS`. A background refresh job would be a natural next step.

### Scoring (1–10 per activity per day)
| Activity | Key signals |
|---|---|
| Skiing | Snowfall (heavy weight), cold temps; penalised by rain / extreme wind |
| Surfing | Wind speed (wave proxy), mild temps; penalised by rain |
| Outdoor sightseeing | Clear skies, mild temps; penalised by precip / wind |
| Indoor sightseeing | Baseline 5, boosted by rain / cloud / extreme temps |

Scores are sorted descending per day so the best activity appears first.

## What I'd Add With More Time
- Retry mechanism (if fails to fetch data from geocoding or forcast API)
- Background refresh worker (cron / pg_cron) — so users don't pay the latency cost of a cache miss
- Error-handling middleware — right now errors bubble up as raw Apollo errors with no consistent shape
- Rate limiting — Open-Meteo has request limits and a single client could exhaust them
- Swell data from a marine API for more accurate surf scoring
