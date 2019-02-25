import { makeAugmentedSchema } from 'neo4j-graphql-js';

export const enums = `
enum Preservation {
  FROZEN
  CANNED
  FRESH
  NONE
}
`;

const typeDefs = `
type Product {
  name: String
  code: String!
  preservation: [Int]
  categories: [Category] @relation(name: "BELONGS", direction: "OUT")
  brands: [Brand] @relation(name: "MARKED_BY", direction: "OUT")
  stores: [Store] @relation(name: "SELL", direction: "IN")
}

type Category {
  name: String!
  count: Int
  products: [Product] @relation(name: "BELONGS", direction: "IN")
}

type Brand {
  name: String!
  quality: Int
  products: [Product] @relation(name: "BELONGS", direction: "IN")
}

type Store {
  name: String!
  country: String
  products: [Product] @relation(name: "SELL", direction: "OUT")
  _id: ID!
}

type Query {
  searchStores(cats: [String]): [Store] @cypher(statement:
    "MATCH (store:Store)-[:SELL]->(p:Product)-[:BELONGS]->(c:Category) WHERE c.name IN $cats RETURN store"
  )
  searchProducts(cats: [String]): [Product] @cypher(statement:
    "MATCH (product:Product)-[BELONGS]->(c:Category) WHERE c.name IN $cats RETURN product"
  )
}
`;

export const enumResolvers = {
  Preservation: {
    FROZEN: 0,
    CANNED: 1,
    FRESH: 2,
    NONE: 3,
  },
}; // cause "Cannot read property 'type' of undefined"  neo4j-graphql-js/dist/utils.js:906:36

const resolvers = {};

export const neo4jSchema = makeAugmentedSchema({
  typeDefs,
  resolvers,
});
