import { GraphQLError } from 'graphql';
import bcrypt from 'bcrypt';
import { addToken } from '../utils/JwtUtil';
import User, { TUser } from '../models/User';
import { TSafe } from '../models/Safe';
import { Document } from 'mongoose';
import { ApolloServerContext } from '../typings';

export const userTypeDefs = `#graphql
  input UserInput {
    firstName: String!,
    lastName: String!,
    language: String!,
    country: String!,
    email: String!,
    phoneCountry: String!,
    phone: String!,
    password: String!,
  }
  type UserAuthenticated {
    firstName: String!,
    lastName: String!,
    language: String!,
    country: String!,
    email: String!,
    phoneCountry: String!,
    phone: String!,
    token: String,
    emailVerified: Boolean!,
    mobileVerified: Boolean!,
    introductionViewed: Boolean!,
    safes: [SafeResult]
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
    confirmMobile(code: Int!): UserAuthenticated
    introViewed(viewed: Boolean!): Boolean
  }
`;

const newSafe = (name: string): TSafe => {
  return { name, items: [] };
};

export const userResolvers = {
  Query: {
    alive() {
      return 'I am alive';
    },
  },

  Mutation: {
    async sigupUser(
      _: any,
      {
        userInput: { firstName, lastName, country, language, email, phoneCountry, phone, password },
      }: { userInput: TUser },
      context: ApolloServerContext
    ): Promise<TUser> {
      console.log('sigupUser email: context', context);
      const { userId } = context;
      console.log('sigupUser email/userId', email, userId);
      const existingUser = await User.findOne<TUser>({ email }).exec();
      if (existingUser) {
        throw new GraphQLError('User already exists', {
          extensions: { code: 'USER_ALREADY_EXIST', email },
        });
      }

      const verifyCode = generateVerifyCode();
      try {
        const safes: TSafe[] = [newSafe('Personal Documents'), newSafe('Friends and family')];
        const newUser = await User.create<TUser>({
          firstName,
          lastName,
          country,
          language,
          email,
          phoneCountry,
          phone,
          password,
          emailVerified: false,
          mobileVerified: false,
          mobileVerifyCode: verifyCode,
          introductionViewed: false,
          safes,
        });
        addToken(newUser);
        delete newUser.password;
        newUser;
        return newUser;
      } catch (err: any) {
        throw new GraphQLError('Sign-up user error', {
          extensions: { code: 'SIGUN_UP_ERROR', message: err.message },
        });
      }
    },

    async confirmMobile(
      _: any,
      { code }: { code: number },
      context: ApolloServerContext
    ): Promise<TUser> {
      const { userId } = context;
      const doc = await User.findById<Document & TUser>(userId);
      if (!doc) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'USER_NOT_FOUND' },
        });
      }
      if (doc.mobileVerifyCode !== code) {
        throw new GraphQLError('Invalid confirmation code', {
          extensions: { code: 'USER_INVALID_CONFIRMATION_CODE' },
        });
      }
      doc.mobileVerifyCode = undefined;
      doc.mobileVerified = true;
      const user = await doc.save();
      addToken(user);
      return user;
    },

    async introViewed(
      _: any,
      { viewed }: { viewed: boolean },
      context: ApolloServerContext
    ): Promise<boolean> {
      const { userId } = context;
      const doc = await User.findById<Document & TUser>(userId);
      if (!doc) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'USER_NOT_FOUND' },
        });
      }
      doc.introductionViewed = true;
      await doc.save();
      return true;
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
      if (!user.password) {
        throw new GraphQLError('Unexpected Error', {
          extensions: { code: 'PASSWORD_NOT_EXIST', email },
        });
      }
      const auth = await bcrypt.compare(password, user.password);
      if (!auth) {
        throw new GraphQLError('Invalid username or password', {
          extensions: { code: 'USER_INVALID_USERNAME_PASSWORD', email },
        });
      }
      delete user.password;
      addToken(user);
      return user;
    },
  },
};

const generateVerifyCode = (): number => {
  const num = Math.floor(Math.random() * 100000)
    .toString()
    .padEnd(5, '0');

  return parseInt(num, 10);
};
