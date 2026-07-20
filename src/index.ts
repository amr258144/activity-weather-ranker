import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs } from "./graphql/typeDefs";
import { resolvers } from "./graphql/resolvers";
import { env } from "./config/env";
import { connectDB } from "./db/connection";

const server = new ApolloServer({ typeDefs, resolvers });

connectDB()
  .then(() => startStandaloneServer(server, { listen: { port: env.PORT } }))
  .then(({ url }) => console.log(`Server ready at ${url}`))
  .catch((err) => {
    console.error("Failed to connect to DB", err);
    process.exit(1);
  });
