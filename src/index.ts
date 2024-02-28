import express, { Express, Request, Response } from 'express';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import router from './router';
import authCheck from './middleware/authCheck';
import { typeDefs, resolvers } from './graphql/schema';

dotenv.config();
const PORT: number = parseInt(process.env.PORT as string, 10);
const server = new ApolloServer({ typeDefs, resolvers });

const app: Express = express();
const port = process.env.PORT;
const db = process.env.MONGO_URI as string;

// app.use(bodyParser.json());
// app.use(cookieParser());

// app.get('/alive', (_req, res) => {
//   res.send('I am alive');
// });

// app.use(router);
// app.use(authCheck);
(async () => {
  try {
    console.log('Connecting to DB ...');
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('DB Connected!');
    console.log('Starting Apollo Server');
    const { url } = await startStandaloneServer(server, {
      listen: { port: PORT },
    });
    console.log('Started Apollo Server on port %d', PORT);
  } catch (error) {
    console.log('Server start error:', error);
  }
})();
