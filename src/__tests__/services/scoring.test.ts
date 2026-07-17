import { rankDays } from "../../services/scoring";
import { DayWeather } from "../../services/weather";

const base: DayWeather = {
  date: "2025-01-01",
  temperature_max: 20,
  temperature_min: 10,
  precipitation_mm: 0,
  snowfall_cm: 0,
  wind_speed_max: 10,
  cloud_cover_mean: 20,
};

describe("skiing", () => {
  it("scores high with heavy snowfall and cold temps", () => {
    const scores = rankDays([{ ...base, snowfall_cm: 30, temperature_max: -5, precipitation_mm: 0 }]);
    const skiing = scores[0].scores.find((s) => s.activity === "skiing")!;
    expect(skiing.score).toBeGreaterThanOrEqual(8);
  });

  it("penalises rain with no snow", () => {
    const withRain = rankDays([{ ...base, snowfall_cm: 0, precipitation_mm: 10, temperature_max: -2 }]);
    const withoutRain = rankDays([{ ...base, snowfall_cm: 0, precipitation_mm: 0, temperature_max: -2 }]);
    const rainScore = withRain[0].scores.find((s) => s.activity === "skiing")!.score;
    const dryScore = withoutRain[0].scores.find((s) => s.activity === "skiing")!.score;
    expect(rainScore).toBeLessThan(dryScore);
  });

  it("penalises extreme wind", () => {
    const highWind = rankDays([{ ...base, snowfall_cm: 10, wind_speed_max: 60 }]);
    const lowWind = rankDays([{ ...base, snowfall_cm: 10, wind_speed_max: 10 }]);
    const highWindScore = highWind[0].scores.find((s) => s.activity === "skiing")!.score;
    const lowWindScore = lowWind[0].scores.find((s) => s.activity === "skiing")!.score;
    expect(highWindScore).toBeLessThan(lowWindScore);
  });
});

describe("surfing", () => {
  it("scores high with strong wind and mild temp", () => {
    const scores = rankDays([{ ...base, wind_speed_max: 50, temperature_max: 22, precipitation_mm: 0 }]);
    const surfing = scores[0].scores.find((s) => s.activity === "surfing")!;
    expect(surfing.score).toBeGreaterThanOrEqual(8);
  });

  it("penalises heavy rain", () => {
    const withRain = rankDays([{ ...base, wind_speed_max: 30, precipitation_mm: 15 }]);
    const withoutRain = rankDays([{ ...base, wind_speed_max: 30, precipitation_mm: 0 }]);
    const rainScore = withRain[0].scores.find((s) => s.activity === "surfing")!.score;
    const dryScore = withoutRain[0].scores.find((s) => s.activity === "surfing")!.score;
    expect(rainScore).toBeLessThan(dryScore);
  });

  it("scores lower with cold temp", () => {
    const cold = rankDays([{ ...base, wind_speed_max: 30, temperature_max: 5 }]);
    const mild = rankDays([{ ...base, wind_speed_max: 30, temperature_max: 20 }]);
    const coldScore = cold[0].scores.find((s) => s.activity === "surfing")!.score;
    const mildScore = mild[0].scores.find((s) => s.activity === "surfing")!.score;
    expect(coldScore).toBeLessThan(mildScore);
  });
});

describe("outdoor sightseeing", () => {
  it("scores high with clear skies and mild temp", () => {
    const scores = rankDays([{ ...base, cloud_cover_mean: 5, temperature_max: 22, precipitation_mm: 0, wind_speed_max: 10 }]);
    const outdoor = scores[0].scores.find((s) => s.activity === "outdoor_sightseeing")!;
    expect(outdoor.score).toBeGreaterThanOrEqual(8);
  });

  it("penalises rain", () => {
    const withRain = rankDays([{ ...base, precipitation_mm: 8 }]);
    const withoutRain = rankDays([{ ...base, precipitation_mm: 0 }]);
    const rainScore = withRain[0].scores.find((s) => s.activity === "outdoor_sightseeing")!.score;
    const dryScore = withoutRain[0].scores.find((s) => s.activity === "outdoor_sightseeing")!.score;
    expect(rainScore).toBeLessThan(dryScore);
  });

  it("penalises strong wind", () => {
    const windy = rankDays([{ ...base, wind_speed_max: 45 }]);
    const calm = rankDays([{ ...base, wind_speed_max: 10 }]);
    const windyScore = windy[0].scores.find((s) => s.activity === "outdoor_sightseeing")!.score;
    const calmScore = calm[0].scores.find((s) => s.activity === "outdoor_sightseeing")!.score;
    expect(windyScore).toBeLessThan(calmScore);
  });
});

describe("indoor sightseeing", () => {
  it("has baseline score of 5 in neutral conditions", () => {
    const scores = rankDays([{ ...base, precipitation_mm: 0, cloud_cover_mean: 0, temperature_max: 20 }]);
    const indoor = scores[0].scores.find((s) => s.activity === "indoor_sightseeing")!;
    expect(indoor.score).toBe(5);
  });

  it("boosts score with heavy rain", () => {
    const rainy = rankDays([{ ...base, precipitation_mm: 20 }]);
    const dry = rankDays([{ ...base, precipitation_mm: 0 }]);
    const rainyScore = rainy[0].scores.find((s) => s.activity === "indoor_sightseeing")!.score;
    const dryScore = dry[0].scores.find((s) => s.activity === "indoor_sightseeing")!.score;
    expect(rainyScore).toBeGreaterThan(dryScore);
  });

  it("boosts score with extreme heat", () => {
    const hot = rankDays([{ ...base, temperature_max: 38 }]);
    const mild = rankDays([{ ...base, temperature_max: 20 }]);
    const hotScore = hot[0].scores.find((s) => s.activity === "indoor_sightseeing")!.score;
    const mildScore = mild[0].scores.find((s) => s.activity === "indoor_sightseeing")!.score;
    expect(hotScore).toBeGreaterThan(mildScore);
  });

  it("boosts score with extreme cold", () => {
    const cold = rankDays([{ ...base, temperature_max: -5 }]);
    const mild = rankDays([{ ...base, temperature_max: 20 }]);
    const coldScore = cold[0].scores.find((s) => s.activity === "indoor_sightseeing")!.score;
    const mildScore = mild[0].scores.find((s) => s.activity === "indoor_sightseeing")!.score;
    expect(coldScore).toBeGreaterThan(mildScore);
  });
});

describe("rankDays", () => {
  it("returns scores sorted descending per day", () => {
    const result = rankDays([base]);
    const scores = result[0].scores.map((s) => s.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("preserves the date", () => {
    const result = rankDays([{ ...base, date: "2025-03-15" }]);
    expect(result[0].date).toBe("2025-03-15");
  });

  it("returns all 4 activities", () => {
    const result = rankDays([base]);
    const activities = result[0].scores.map((s) => s.activity);
    expect(activities).toEqual(expect.arrayContaining(["skiing", "surfing", "outdoor_sightseeing", "indoor_sightseeing"]));
  });

  it("clamps scores between 1 and 10", () => {
    const extreme = { ...base, snowfall_cm: 999, temperature_max: -50, wind_speed_max: 0, precipitation_mm: 0 };
    const result = rankDays([extreme]);
    result[0].scores.forEach(({ score }) => {
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(10);
    });
  });
});
