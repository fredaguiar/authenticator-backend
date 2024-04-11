import { mergeTypeDefs } from '@graphql-tools/merge';
import { userTypeDefs } from './userSchema';
import { safeTypeDefs } from './safeSchema';
import { itemTypeDefs } from './itemSchema';

const rootTypeDefs = `#graphql
  type Query
  type Mutation
`;

const typeDefs = mergeTypeDefs([rootTypeDefs, userTypeDefs, safeTypeDefs, itemTypeDefs]);

export default [rootTypeDefs, typeDefs];
