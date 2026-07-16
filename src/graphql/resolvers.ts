export const resolvers = {
  Query: {
    rankActivities: async (_: unknown, { city }: { city: string }) => {
      return { city, days: [] };
    },
  },
};
