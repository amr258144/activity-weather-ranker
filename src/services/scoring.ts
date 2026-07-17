import { DayWeather } from "./weather";

export type Activity = "skiing" | "surfing" | "outdoor_sightseeing" | "indoor_sightseeing";

function clamp(v: number): number {
  return Math.max(1, Math.min(10, Math.round(v)));
}

function scoreSkiing(d: DayWeather): number {
  const snowScore = Math.min(d.snowfall_cm / 3, 10);
  const coldScore = d.temperature_max < 0 ? 10 : Math.max(0, 10 - d.temperature_max);
  const windPenalty = d.wind_speed_max > 50 ? 3 : d.wind_speed_max > 30 ? 1 : 0;
  const rainPenalty = d.precipitation_mm > 5 && d.snowfall_cm === 0 ? 3 : 0;
  return clamp((snowScore * 4 + coldScore * 3) / 7 - windPenalty - rainPenalty);
}

function scoreSurfing(d: DayWeather): number {
  const windScore = Math.min(d.wind_speed_max / 5, 10);
  const tempScore = d.temperature_max >= 15 && d.temperature_max <= 28 ? 8 : d.temperature_max >= 10 ? 5 : 2;
  const rainPenalty = d.precipitation_mm > 10 ? 2 : 0;
  return clamp((windScore * 5 + tempScore * 3) / 8 - rainPenalty);
}

function scoreOutdoorSightseeing(d: DayWeather): number {
  const cloudScore = (100 - d.cloud_cover_mean) / 10;
  const tempScore = d.temperature_max >= 18 && d.temperature_max <= 26 ? 10 : d.temperature_max >= 12 ? 7 : d.temperature_max >= 5 ? 4 : 2;
  const rainPenalty = d.precipitation_mm > 1 ? Math.min(d.precipitation_mm / 2, 5) : 0;
  const windPenalty = d.wind_speed_max > 40 ? 2 : d.wind_speed_max > 25 ? 1 : 0;
  return clamp((cloudScore * 3 + tempScore * 4) / 7 - rainPenalty - windPenalty);
}

function scoreIndoorSightseeing(d: DayWeather): number {
  const base = 5;
  const rainBonus = Math.min(d.precipitation_mm / 3, 4);
  const cloudBonus = d.cloud_cover_mean / 25;
  const extremeTemp = d.temperature_max > 35 || d.temperature_max < 0 ? 3 : 0;
  return clamp(base + rainBonus + cloudBonus + extremeTemp);
}

export interface DayRanking {
  date: string;
  scores: { activity: Activity; score: number }[];
}

export function rankDays(days: DayWeather[]): DayRanking[] {
  return days.map((d) => {
    const scores = [
      { activity: "skiing" as Activity, score: scoreSkiing(d) },
      { activity: "surfing" as Activity, score: scoreSurfing(d) },
      { activity: "outdoor_sightseeing" as Activity, score: scoreOutdoorSightseeing(d) },
      { activity: "indoor_sightseeing" as Activity, score: scoreIndoorSightseeing(d) },
    ].sort((a, b) => b.score - a.score);
    return { date: d.date, scores };
  });
}
