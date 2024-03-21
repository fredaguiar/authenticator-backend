import { mergeResolvers } from '@graphql-tools/merge';
import { userResolvers } from './userSchema';
import { safeResolvers } from './safeSchema';

const resolvers = mergeResolvers([userResolvers, safeResolvers]);

export default [resolvers];
