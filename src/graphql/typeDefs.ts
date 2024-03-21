import { mergeTypeDefs } from '@graphql-tools/merge';
import { userTypeDefs } from './userSchema';
import { safeTypeDefs } from './safeSchema';

const rootTypeDefs = `#graphql
  type Query
  type Mutation
`;

const typeDefs = mergeTypeDefs([rootTypeDefs, userTypeDefs, safeTypeDefs]);

export default [rootTypeDefs, typeDefs];
