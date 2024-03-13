// npm install @apollo/server express graphql cors
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import { typeDefs, resolvers, ApolloServerContext } from './graphql/userGql';
import { addToken, verifyToken } from './utils/JwtUtil';
import { GraphQLError } from 'graphql';

dotenv.config();
const PORT: number = parseInt(process.env.PORT as string, 10);

const app = express();
const httpServer = http.createServer(app);
const server = new ApolloServer<ApolloServerContext>({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

(async () => {
  console.log('Connecting to DB ...');
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log('DB Connected!');

  console.log('Starting Apollo Server');
  await server.start();
  console.log('Apollo Server Started!');

  app.use(
    '/graphql',
    // cors<cors.CorsRequest>({ origin: '*' }),
    express.json(),
    cookieParser(), // TODO: may not be necessary
    expressMiddleware(server, {
      context: async ({ req, res }: { req: any; res: any }): Promise<ApolloServerContext> => {
        let userId = null;
        if (req.headers.authorization) {
          const authToken = req.headers.authorization.substring(7).trim();
          console.log('req.headers.authorization:::', authToken);
          try {
            const decoded = authToken ? verifyToken(authToken) : null;
            console.log('>>>>>>>>>>>>>>>>>> decoded', decoded);
            userId = decoded?.id;
          } catch (err: any) {
            console.log('req.headers.authorization Bearer', err.stack);
            throw new GraphQLError('User is not authenticated', {
              extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } },
            });
          }
        }
        return { req, res, userId };
      },
    })
  );

  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
})();
