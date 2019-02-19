import { neo4jgraphql, makeAugmentedSchema } from 'neo4j-graphql-js';

const typeDefs = `
type Product {
  name: String
  code: String!
  packaging: Int
  categories: [Category] @relation(name: "BELONGS", direction: "OUT")
  brands: [Brand] @relation(name: "MARKED_BY", direction: "OUT")
  stores: [Store] @relation(name: "SELL", direction: "IN")
}

type Category {
  name: String
  count: Int
  products: [Product] @relation(name: "BELONGS", direction: "IN")
}

type Brand {
  name: String
  quality: Int
  products: [Product] @relation(name: "BELONGS", direction: "IN")
}

type Store {
  name: String
  country: String
  products: [Product] @relation(name: "SELL", direction: "OUT")
}
`;

const resolvers = {
  Query: {
    Product(parent, params, ctx, info) {
      return neo4jgraphql(parent, params, ctx, info);
    }
  }
}

export const schema = makeAugmentedSchema({
  typeDefs,
  resolvers
})