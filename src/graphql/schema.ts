import { GraphQLError } from 'graphql';
import bcrypt from 'bcrypt';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import User, { TUser } from '../models/User';

const TOKEN_EXPIRES_MS = 60 * 60 * 1000; // 1hr
export const COOKIE_NAME = 'jid'; // 1hr
export const PRIVATE_KEY = fs.readFileSync('keys/rsa.ppk', 'utf-8');
export const PUBLIC_KEY = fs.readFileSync('keys/rsa.pub', 'utf-8');

export type ApolloServerContext = { req: any; res: any };

export const typeDefs = `#graphql
  type User {
    name: String!,
    email: String!,
    password: String!,
  }
  input UserInput {
    name: String!,
    email: String!,
    password: String!,
  }
  type UserAuthenticated {
    name: String!,
    email: String!,
    token: String!,
  }
  input UserLogin {
    email: String!,
    password: String!,
  }
  type Query {
    alive: String!
    getUserByEmail(email: String!): User
  }
  type Mutation {
    sigupUser(userInput: UserInput!): UserAuthenticated
    login(userInput: UserLogin!): UserAuthenticated
  }
`;

export const resolvers = {
  Query: {
    alive() {
      return 'I am alive';
    },

    async getUserByEmail(_: any, { email }: { email: String }) {
      const result = await User.findOne<TUser>({ email }).exec();
      if (!result) {
        return null;
      }
      return { name: result.name, email: result.email, password: result.password };
    },
  },

  Mutation: {
    async sigupUser(
      _: any,
      {
        userInput: { name, email, password },
      }: { userInput: { name: string; email: string; password: string } },
      context: ApolloServerContext
    ) {
      const { req, res } = context;

      const existingUser = await User.findOne<TUser>({ email }).exec();
      if (existingUser) {
        throw new GraphQLError('User already exists', {
          extensions: { code: 'USER_ALREADY_EXIST', email },
        });
      }

      try {
        const newUser = await User.create<TUser>({ name, email, password });
        const token = generateToken(newUser, res);
        return { name: newUser.name, email: newUser.email, token };
      } catch (err: any) {
        throw new GraphQLError('Sign-up user error', {
          extensions: { code: 'SIGUN_UP_ERROR', message: err.message },
        });
      }
    },

    async login(
      _: any,
      { userInput: { email, password } }: { userInput: { email: string; password: string } },
      context: ApolloServerContext
    ) {
      const { req, res } = context;

      console.log('email, password', email, password);

      try {
        const user = await User.findOne<TUser>({ email }).exec();
        if (!user) {
          throw new GraphQLError('User does not exist', {
            extensions: { code: 'USER_NOT_EXIST', email },
          });
        }
        const auth = await bcrypt.compare(password, user.password);
        if (!auth) {
          throw new GraphQLError('Invalid username or password', {
            extensions: { code: 'USER_INVALID_USERNAME_PASSWORD', email },
          });
        }

        const token = generateToken(user, res);

        return { name: user.name, email: user.email, token };
      } catch (err: any) {
        throw new GraphQLError('Login error', {
          extensions: { code: 'USER_LOGIN_ERROR', email },
        });
      }
    },
  },
};

const generateToken = (user: TUser, res: any) => {
  const token = jwt.sign({ id: user._id }, PRIVATE_KEY, {
    expiresIn: TOKEN_EXPIRES_MS,
    algorithm: 'RS256',
  });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production', // HTTPS
  });
  return token;
};
