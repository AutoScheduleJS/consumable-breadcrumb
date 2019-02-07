import { MongoClient, Db, Cursor } from 'mongodb';
import { v1 as Neo } from 'neo4j-driver';

interface OFFProduct {
  stores: string;
  product_name: string;
  code: string;
  countries_tags: string[];
  packaging_tags: string[];
}

enum Preservation {
  frozen,
  canned,
  fresh,
  none,
}

const main = async () => {
  const mongoClient = new MongoClient('mongodb://localhost:27017', { useNewUrlParser: true });
  await mongoClient.connect();
  const db = mongoClient.db('off');
  const cursor = retrieveProducts(db);
  await handleProducts(cursor);
  mongoClient.close();
};

const handleProducts = async (cursor: Cursor<OFFProduct>) => {
  const driver = Neo.driver('bolt://localhost', Neo.auth.basic('neo4j', 'admin'));
  const session = driver.session();

  while (cursor.hasNext) {
    const obj: OFFProduct = (await cursor.next()) as OFFProduct;
    const stores: string[] = obj.stores.replace(', ', ',').split(',');
    const countries: string[] = obj.countries_tags.map(tag => tag.slice(3));
    if (countries.length === 0) {
      countries.push('');
    }
    const storeAndRelations = buildStoresAndRelations(stores, countries);
    const toRun = `
        ${buildProduct}
        ${storeAndRelations}
      `;
    await session.run(toRun);
  }
  session.close();
  driver.close();
};
const buildProduct = (obj: OFFProduct) => {
  const preservation = buildPreservation(obj);
  return `MERGE (p:Product {
    code: "${obj.code}",
    name: "${sanitizeProductName(obj.product_name)}"
    ${preservation}
  })`;
};

const buildPreservation = (obj: OFFProduct) =>
  obj.packaging_tags
    ? ', preservation: ' +
      JSON.stringify(
        obj.packaging_tags.map(packagingTagToPreservation).filter(p => p !== Preservation.none)
      )
    : '';

const buildStoresAndRelations = (stores: string[], countries: string[]) => {
  const productRelations: string[] = [];
  const storeCreation = stores.reduce((acc, storeName, sI) => {
    const newStores = countries
      .map((country, cI) => {
        productRelations.push(`MERGE (s${sI + '_' + cI})-[:SELL]->(p)`);
        return `MERGE (s${sI + '_' + cI}:Store {
            name: "${storeName.toLowerCase()}",
            country: "${country}"
          })
        `;
      })
      .join('\n');
    return `${acc}${newStores}`;
  }, '');
  return storeCreation + productRelations.join('\n');
};

const retrieveProducts = (db: Db) =>
  db.collection('products').find(
    {
      product_name: { $exists: true, $ne: '' },
      stores: { $exists: true, $ne: '' },
      code: { $exists: true, $ne: '' },
      countries_tags: { $exists: true },
    },
    {
      batchSize: 100000,
      limit: 500,
      projection: {
        product_name: 1,
        stores: 1,
        code: 1,
        countries_tags: 1,
        packaging_tags: 1,
      },
    }
  );

const packagingTagToPreservation = (tag: string): Preservation => {
  switch (tag) {
    case 'frais':
    case 'fresh':
    case 'fr-frais':
      return Preservation.fresh;
    case 'conserve':
    case 'canned':
    case 'konserve':
      return Preservation.canned;
    case 'surgele':
    case 'frozen':
    case 'surgeles':
    case 'congelado':
    case 'ultracongelado':
      return Preservation.frozen;
    default:
      return Preservation.none;
  }
};

const sanitizeProductName = (name: string) => {
  return name.replace(/[".*+?^${}()|[\]\\]/g, ' ');
};

main();
