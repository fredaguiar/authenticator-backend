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
  input UserInput {
    firstName: String!,
    lastName: String!,
    language: String!,
    country: String!,
    email: String!,
    password: String!,
  }
  type UserAuthenticated {
    firstName: String!,
    lastName: String!,
    language: String!,
    country: String!,
    email: String!,
    password: String!,
  }
  input Credentials {
    email: String!,
    password: String!,
  }
  type Query {
    alive: String!
  }
  type Mutation {
    sigupUser(userInput: UserInput!): UserAuthenticated
    login(credentials: Credentials!): UserAuthenticated
  }
`;

export const resolvers = {
  Query: {
    alive() {
      return 'I am alive';
    },
  },

  Mutation: {
    async sigupUser(
      _: any,
      {
        userInput: { firstName, lastName, country, language, email, password },
      }: { userInput: TUser },
      context: ApolloServerContext
    ): Promise<TUser> {
      const { req: _req, res } = context;
      const existingUser = await User.findOne<TUser>({ email }).exec();
      if (existingUser) {
        throw new GraphQLError('User already exists', {
          extensions: { code: 'USER_ALREADY_EXIST', email },
        });
      }

      try {
        const newUser = await User.create<TUser>({
          firstName,
          lastName,
          country,
          language,
          email,
          password,
        });
        setToken(newUser, res);
        return newUser;
      } catch (err: any) {
        throw new GraphQLError('Sign-up user error', {
          extensions: { code: 'SIGUN_UP_ERROR', message: err.message },
        });
      }
    },

    async login(
      _: any,
      { credentials: { email, password } }: { credentials: { email: string; password: string } },
      context: ApolloServerContext
    ): Promise<TUser> {
      console.log('LOGIN with email, password', email, password);
      const { req: _req, res } = context;
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
      setToken(user, res);
      console.log('LOGIN OK', user.firstName);
      return user;
    },
  },
};

const setToken = (user: TUser, res: any): void => {
  const token = jwt.sign({ id: user._id }, PRIVATE_KEY, {
    expiresIn: TOKEN_EXPIRES_MS,
    algorithm: 'RS256',
  });
  res.setHeader('Authorization', `Bearer ${token}`);

  // res.cookie(COOKIE_NAME, token, {
  //   httpOnly: true,
  //   sameSite: 'strict',
  //   secure: process.env.NODE_ENV === 'production', // HTTPS
  // });
};
