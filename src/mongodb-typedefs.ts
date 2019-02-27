import { Collection, FindOneOptions, ObjectId } from 'mongodb';
import { makeExecutableSchema } from 'graphql-tools';
import { Driver } from 'neo4j-driver/types/v1';

interface LocalStore {
  _id: string;
  name: string;
  storeRef: string;
  availableProducts: Array<{ id: string; price: number }>;
  unavailableProducts: Array<{ id: string; price: number }>;
}

const typeDefs = `
type LocalStore {
  _id: ID!
  name: String!
  storeRef: ID!
  availableProducts: [AvailableProduct]
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
  AddAvailableProduct(localStoreId: ID!, productId: ID!, price: Int!): LocalStore
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
    AddAvailableProduct(_obj, args, context, _info) {
      const neoSession = (context.driver as Driver).session();
      return (context.col as Promise<Collection>)
        .then(col =>
          col.findOneAndUpdate(
            { _id: new ObjectId(args.localStoreId) },
            { $addToSet: { availableProducts: { id: args.productId, price: args.price } } },
            { returnOriginal: false }
          )
        )
        .then(result => {
          console.log('result', result);
          const localStore: LocalStore = result.value;
          if (!localStore) {
            return Promise.reject(null);
          }
          return neoSession
            .run(
              `
            MATCH (store:Store)-[sell:SELL]->(product:Product)
            WHERE id(store) = toInteger($storeId) AND id(product) = toInteger($productId)
            SET (CASE WHEN sell.price IS NULL THEN sell END).price = $price,
            (CASE WHEN sell.price IS NOT NULL THEN sell END).price = (sell.price * sell.count) / (sell.count + 1) + $price / (sell.count + 1),
            sell.count = sell.count + 1
            RETURN sell, store
            `,
              { storeId: localStore.storeRef, productId: args.productId, price: args.price }
            )// TODO: could possibly increment count without adding to set (available product) -> handle case where price = null
            .then(
              val => {
                console.log('neo val', val);
                return localStore;
              }
            );
        })
        .finally(() => neoSession.close());
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
