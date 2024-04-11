import { mergeResolvers } from '@graphql-tools/merge';
import { userResolvers } from './userSchema';
import { safeResolvers } from './safeSchema';
import { itemResolvers } from './itemSchema';

const resolvers = mergeResolvers([userResolvers, safeResolvers, itemResolvers]);

export default [resolvers];
