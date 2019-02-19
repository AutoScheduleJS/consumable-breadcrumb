import { makeAugmentedSchema } from 'neo4j-graphql-js';
import { Session } from 'neo4j-driver/types/v1';
import { v1 as Neo } from 'neo4j-driver';

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

type Query {
  searchStore(cat: String): [Store]
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

const resolvers = {
  Query: {
    searchStore(_object, params, ctx, resolveInfo) {
      const session: Session = ctx.driver.session();
      try {
        return session
          .run(
            `MATCH (store:Store)-[:SELL]->(p:Product)-[:BELONGS]->(:Category {name: "${
              params.cat
            }"}) RETURN store`
          )
          .then(result => extractQueryResult(result, resolveInfo.returnType));
      } finally {
        session.close();
      }
    },
  },
};

const extractQueryResult = ({ records }, returnType) => {
  const { variableName } = typeIdentifiers(returnType);
  let result: any = null;
  if (isArrayType(returnType)) {
    result = records.map(record => record.get(variableName).properties);
  } else if (records.length) {
    // could be object or scalar
    result = records[0].get(variableName);
    result = Array.isArray(result) ? result[0] : result;
  }
  // handle Integer fields
  const res = result.reduce(
    (acc, cur) => [...acc, transformField(cur)],
    []
  );
  console.log(res);
  return res;
};

const transformField = (field: any) =>
  Neo.isInt(field) ? (field.inSafeRange() ? field.toNumber() : field.toString()) : {...field};

const typeIdentifiers = returnType => {
  const typeName = innerType(returnType).toString();
  return {
    variableName: lowFirstLetter(typeName),
    typeName,
  };
};

const innerType = type => (type.ofType ? innerType(type.ofType) : type);

const lowFirstLetter = word => word.charAt(0).toLowerCase() + word.slice(1);

const isArrayType = type => (type ? type.toString().startsWith('[') : false);

export const schema = makeAugmentedSchema({
  typeDefs,
  resolvers,
});
