import { pool } from "../db/connection";
import { env } from "../config/env";
import { getOrCreateCity } from "./geocoding";

export interface DayWeather {
  date: string;
  temperature_max: number;
  temperature_min: number;
  precipitation_mm: number;
  snowfall_cm: number;
  wind_speed_max: number;
  cloud_cover_mean: number;
}

async function fetchFromApi(lat: number, lon: number): Promise<DayWeather[]> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,wind_speed_10m_max,cloud_cover_mean` +
    `&forecast_days=7&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  const data: any = await res.json();
  const d = data.daily;
  return d.time.map((date: string, i: number) => ({
    date,
    temperature_max: d.temperature_2m_max[i],
    temperature_min: d.temperature_2m_min[i],
    precipitation_mm: d.precipitation_sum[i],
    snowfall_cm: d.snowfall_sum[i],
    wind_speed_max: d.wind_speed_10m_max[i],
    cloud_cover_mean: d.cloud_cover_mean[i],
  }));
}

async function getCachedData(cityId: number): Promise<DayWeather[] | null> {
  const cutoff = new Date(Date.now() - env.CACHE_TTL_HOURS * 3600 * 1000);
  const { rows } = await pool.query(
    `SELECT date, temperature_max, temperature_min, precipitation_mm, snowfall_cm, wind_speed_max, cloud_cover_mean
     FROM forecasts WHERE city_id = $1 AND fetched_at > $2 AND date >= CURRENT_DATE ORDER BY date LIMIT 7`,
    [cityId, cutoff]
  );
  if (rows.length === 7) return rows.map((r) => ({ ...r, date: r.date.toISOString().slice(0, 10) }));
  return null;
}

const UPSERT_FORECAST = `
  INSERT INTO forecasts (city_id, date, temperature_max, temperature_min, precipitation_mm, snowfall_cm, wind_speed_max, cloud_cover_mean)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  ON CONFLICT (city_id, date) DO UPDATE SET
    temperature_max = EXCLUDED.temperature_max,
    temperature_min = EXCLUDED.temperature_min,
    precipitation_mm = EXCLUDED.precipitation_mm,
    snowfall_cm = EXCLUDED.snowfall_cm,
    wind_speed_max = EXCLUDED.wind_speed_max,
    cloud_cover_mean = EXCLUDED.cloud_cover_mean,
    fetched_at = NOW()
`;

async function cacheForecastData(cityId: number, days: DayWeather[]) {
  for (const d of days) {
    await pool.query(UPSERT_FORECAST, [cityId, d.date, d.temperature_max, d.temperature_min, d.precipitation_mm, d.snowfall_cm, d.wind_speed_max, d.cloud_cover_mean]);
  }
}

export async function getWeather(city: string): Promise<{ resolvedCity: string; days: DayWeather[] }> {
  const cityRow = await getOrCreateCity(city);
  const cached = await getCachedData(cityRow.id);
  if (cached) return { resolvedCity: cityRow.name, days: cached };

  const days = await fetchFromApi(cityRow.latitude, cityRow.longitude);
  await cacheForecastData(cityRow.id, days);
  return { resolvedCity: cityRow.name, days };
}
