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
  name: String!
  code: String
  preservation: [Int]
  categories: [Category] @relation(name: "BELONGS", direction: "OUT")
  brands: [Brand] @relation(name: "MARKED_BY", direction: "OUT")
  stores: [Sell]
  quantity: Int
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

type Sell @relation(name: "SELL") {
  from: Store
  to: Product
  price: Int
  count: Int
  currentlyAvailable: Boolean
}

type Store {
  name: String!
  country: String
  products: [Sell]
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
