import { neo4jSchema } from './neo4j-typedefs';
import { mongoSchema } from './mongodb-typedefs';

export const linkTypeDefs = `
extend type LocalStore {
  store: [Store]
}
extend type Store {
  localStores: [LocalStore]
}
`;

export const linkResolvers = {
  LocalStore: {
    store: {
      fragment: `... on LocalStore { storeRef }`,
      resolve(localStore, _args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: neo4jSchema,
          operation: 'query',
          fieldName: 'Store',
          args: {
            _id: localStore.storeRef,
          },
          context,
          info,
        });
      }
    }
  },
  Store: {
    localStores: {
      fragment: `... on Store { _id }`,
      resolve(store, _args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: mongoSchema,
          operation: 'query',
          fieldName: 'LocalStore',
          args: {
            storeRef: store._id,
          },
          context,
          info,
        });
      }
    }
  }
}