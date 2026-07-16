export const typeDefs = `#graphql
  type ActivityScore {
    activity: String!
    score: Int!
  }

  type DayRanking {
    date: String!
    scores: [ActivityScore!]!
  }

  type RankingResult {
    city: String!
    days: [DayRanking!]!
  }

  type Query {
    rankActivities(city: String!): RankingResult!
  }
`;
