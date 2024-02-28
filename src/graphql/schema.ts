import User, { TUser } from '../models/User';

export const typeDefs = `#graphql
  type User {
    name: String!,
    email: String!,
    password: String!,
  }
  type UserInput {
    name: String!,
    email: String!,
    password: String!,
  }
  type LoginInput {
    email: String!,
    password: String!,
  }
  type Message {
    text: String
  }
  type Query {
    getUserByEmail(email: String): User
  }
`;

export const resolvers = {
  Query: {
    async getUserByEmail(_: any, { email }: { email: String }) {
      const result = await User.findOne<TUser>({ email }).exec();
      if (!result) {
        return null;
      }
      return { name: result.name, email: result.email, password: result.password };
    },
  },
};
