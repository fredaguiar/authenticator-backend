import { GraphQLError } from 'graphql';
import { TSafe, Safe } from '../models/Safe';
import { Document } from 'mongoose';
import { ApolloServerContext } from '../typings';
import User, { TUser } from '../models/User';

export const safeTypeDefs = `#graphql
  input SafeInput {
    name: String!,
  }
  type SafeResult {
    name: String!,
    _id: ID!,
  }
  type Query {
    getSafe: String!
  }
  type Mutation {
    createSafe(safeInput: SafeInput!): SafeResult
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
      try {
        await user.save();
      } catch (err: any) {
        throw new GraphQLError('Create safe error', {
          extensions: { code: 'CREATE_SAFE_ERROR', message: err.message },
        });
      }
      return safe;
    },
  },
};
