import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs } from "./graphql/typeDefs";
import { resolvers } from "./graphql/resolvers";
import { env } from "./config/env";

const server = new ApolloServer({ typeDefs, resolvers });

startStandaloneServer(server, { listen: { port: env.PORT } }).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
