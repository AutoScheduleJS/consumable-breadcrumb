import { Collection } from 'mongodb';

export const typeDefs = `
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
  localStore(_id: ID, name: String, storeRef: ID): [LocalStore]
}
`;

export const resolver = {
  Query: {
    localStore(_obj, args, context, _info) {
      const col: Collection = context.col;
      col.find(args);
    },
  },
  LocalStore: {
    availableProducts(localStore) {
      localStore.availableProducts;
    },
    unavailableProducts(localStore) {
      localStore.unavailableProducts;
    },
  },
};
