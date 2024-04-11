import { GraphQLError } from 'graphql';
import { TItem, Item } from '../models/Item';
import { Document } from 'mongoose';
import { ApolloServerContext } from '../typings';
import User, { TUser } from '../models/User';

export const itemTypeDefs = `#graphql
  input ItemInput {
    name: String!,
    type: String!,
  }
  type ItemResult {
    name: String!,
    type: String!,
    _id: ID!,
  }
  type Query {
    getItem: String!
  }
  type Mutation {
    addItem(ItemInput: ItemInput!): ItemResult
  }
`;

export const itemResolvers = {
  Query: {
    getItem() {
      return 'I am an item';
    },
  },

  Mutation: {
    async addItem(
      _: any,
      { ItemInput: { name, type, safeId } }: { ItemInput: TItem & { safeId: string } },
      context: ApolloServerContext
    ): Promise<TItem> {
      const { userId } = context;
      console.log('addItem userId, safeId', userId, safeId);

      const user = await User.findOne<Document & TUser>(
        { _id: userId, 'safes._id': safeId },
        { safes: { $elemMatch: { _id: safeId } } }
      );

      if (!user || user.safes.length === 0) {
        throw new GraphQLError('Safe not found', {
          extensions: { code: 'SAFE_NOT_FOUND', safeId },
        });
      }

      const item = new Item({ name, type });
      if (type === 'photos') user.safes[0]?.items.push(item);

      try {
        await user.save();
      } catch (err: any) {
        throw new GraphQLError('Add item error', {
          extensions: { code: 'ADD_ITEM_ERROR', message: err.message },
        });
      }
      return item;
    },
  },
};
