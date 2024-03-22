import { GraphQLError } from 'graphql';
import { TSafe, Safe } from '../models/Safe';
import { Document } from 'mongoose';
import { ApolloServerContext } from '../typings';
import User, { TUser } from '../models/User';

export const safeTypeDefs = `#graphql
  input SafeInput {
    name: String!,
  }
  type SafeItem {
    name: String!,
    _id: ID!,
  }
  type Query {
    getSafe: String!
  }
  type Mutation {
    createSafe(safeInput: SafeInput!): SafeItem
  }
`;

export const safeResolvers = {
  Query: {
    getSafe() {
      return 'I am a safe';
    },
  },

  Mutation: {
    async createSafe(
      _: any,
      { safeInput: { name } }: { safeInput: TSafe },
      context: ApolloServerContext
    ): Promise<TSafe> {
      const { userId } = context;
      console.log('createSafe userId', userId);
      const user = await User.findById<Document & TUser>(userId);
      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'USER_NOT_FOUND', userId },
        });
      }
      const safe = new Safe({ name });
      user.safes?.push(safe);
      await user.save();
      return safe;
    },
  },
};

const generateVerifyCode = (): number => {
  const num = Math.floor(Math.random() * 100000)
    .toString()
    .padEnd(5, '0');

  return parseInt(num, 10);
};
