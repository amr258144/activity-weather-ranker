import { getWeather } from "../services/weather";
import { rankDays } from "../services/scoring";

function validateCity(city: string): void {
  if (!city || !city.trim()) throw new Error("city is required");

  if (city.trim().length > 100) throw new Error("city name is too long");
  
  if (!/^[\p{L}\p{M}\s''.,-]+$/u.test(city.trim())) throw new Error("city contains invalid characters");
}

export const resolvers = {
  Query: {
    rankActivities: async (_: unknown, { city }: { city: string }) => {
      validateCity(city);
      const { resolvedCity, days } = await getWeather(city.trim());
      const rankedDays = rankDays(days);
      return { city: resolvedCity, days: rankedDays };
    },
  },
};
