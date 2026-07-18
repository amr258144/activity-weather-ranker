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
  rankActivities(city: "Mumbai") {
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

## How I Approached This

The exercise intentionally leaves several implementation details open. In a day-to-day team setting, I would normally sync with a Product Manager or team members to validate requirements. For this challenge, I moved forward with the following assumptions:

- No authentication required for this scope.
- I interpreted "persist" as caching forecast data in PostgreSQL and refreshing it after a configurable TTL, rather than storing a historical weather archive.
- Wind speed is used as a proxy for surf/wave conditions — Open-Meteo's free tier does not provide swell data. A real implementation would use a marine API.
- Uses Open-Meteo's geocoding API to resolve city names to lat/lon coordinates.
- Scoring weights are opinionated and heuristic-based. In a production feature, these would be iterated on with domain experts.

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

## Trade-offs & Future Improvements
- Refresh forecasts synchronously on cache expiry rather than introducing background workers. Background refresh worker (cron / pg_cron) can be added in future.
- Error-handling middleware — right now errors bubble up as raw Apollo errors with no consistent shape.
- Rate limiting — Open-Meteo has request limits and a single client could exhaust them.
- Swell data from a marine API for more accurate surf scoring.

## AI Usage
The assignment explicitly encouraged AI usage. I used ChatGPT primarily for:
- brainstorming the data model
- generating and refining GraphQL boilerplate
- reviewing TypeScript types
- debugging implementation issues
- sanity-check design decisions

I reviewed, modified, and tested all AI-generated code before committing it.
