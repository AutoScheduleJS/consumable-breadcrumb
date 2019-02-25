import { Collection, FindOneOptions } from 'mongodb';
import { makeExecutableSchema } from 'graphql-tools';

const typeDefs = `
type LocalStore {
  _id: ID!
  name: String!
  storeRef: ID!
  availableProducts: [AvailableProduct],
  unavailableProducts: [UnavailableProduct]
}

type AvailableProduct {
  id: ID!
  price: Int
}

type UnavailableProduct {
  id: ID!
}

type Query {
  LocalStore(_id: ID, name: String, storeRef: ID): [LocalStore]
}

type Mutation {
  CreateLocalStore(name: String!, storeRef: ID!): LocalStore
}
`;

const resolvers = {
  Query: {
    LocalStore(_obj, args, context, _info) {
      const colPromise: Promise<Collection> = context.col;
      return colPromise.then(col => col.find(args, findOptions).toArray());
    },
  },
  Mutation: {
    CreateLocalStore(_obj, args, context, _info) {
      const colPromise: Promise<Collection> = context.col;
      return colPromise.then(col => col.insertOne({ ...args })).then(result => result.ops[0]);
    },
  },
  LocalStore: {
    availableProducts(localStore) {
      return localStore.availableProducts;
    },
    unavailableProducts(localStore) {
      return localStore.unavailableProducts;
    },
  },
};

const findOptions: FindOneOptions = {
  limit: 1000,
};

export const mongoSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
