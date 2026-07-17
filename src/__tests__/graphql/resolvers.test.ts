import { resolvers } from "../../graphql/resolvers";

jest.mock("../../services/weather", () => ({
  getWeather: jest.fn(),
}));

import { getWeather } from "../../services/weather";

const mockGetWeather = getWeather as jest.MockedFunction<typeof getWeather>;

const mockDays = [
  {
    date: "2025-01-01",
    temperature_max: 22,
    temperature_min: 12,
    precipitation_mm: 0,
    snowfall_cm: 0,
    wind_speed_max: 15,
    cloud_cover_mean: 10,
  },
];

describe("rankActivities resolver", () => {
  beforeEach(() => {
    mockGetWeather.mockResolvedValue({ resolvedCity: "Chamonix", days: mockDays });
  });

  afterEach(() => jest.clearAllMocks());

  it("returns ranked days for a valid city", async () => {
    const result = await resolvers.Query.rankActivities({} as any, { city: "Chamonix" });
    expect(result.city).toBe("Chamonix");
    expect(result.days).toHaveLength(1);
    expect(result.days[0].scores).toHaveLength(4);
  });

  it("passes trimmed city to getWeather", async () => {
    await resolvers.Query.rankActivities({} as any, { city: "  Paris  " });
    expect(mockGetWeather).toHaveBeenCalledWith("Paris");
  });

  it("scores are sorted descending", async () => {
    const result = await resolvers.Query.rankActivities({} as any, { city: "Chamonix" });
    const scores = result.days[0].scores.map((s: { score: number }) => s.score);
    expect(scores).toEqual([...scores].sort((a: number, b: number) => b - a));
  });

  it("throws if city is empty", async () => {
    await expect(resolvers.Query.rankActivities({} as any, { city: "" })).rejects.toThrow("city is required");
  });

  it("throws if city is whitespace only", async () => {
    await expect(resolvers.Query.rankActivities({} as any, { city: "   " })).rejects.toThrow("city is required");
  });

  it("throws if city is too long", async () => {
    await expect(resolvers.Query.rankActivities({} as any, { city: "a".repeat(101) })).rejects.toThrow("city name is too long");
  });

  it("throws if city contains invalid characters", async () => {
    await expect(resolvers.Query.rankActivities({} as any, { city: "Paris<script>" })).rejects.toThrow("city contains invalid characters");
  });

  it("does not call getWeather if validation fails", async () => {
    await expect(resolvers.Query.rankActivities({} as any, { city: "" })).rejects.toThrow();
    expect(mockGetWeather).not.toHaveBeenCalled();
  });
});
