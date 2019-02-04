import { MongoClient } from 'mongodb';
import { v1 as Neo } from 'neo4j-driver';

const main = async () => {
  const driver = Neo.driver('bolt://localhost', Neo.auth.basic('neo4j', 'admin'));
  const session = driver.session();
  const mongoClient = new MongoClient('mongodb://localhost:27017', { useNewUrlParser: true });
  await mongoClient.connect();
  const db = mongoClient.db('off');
  const cursor = db.collection('products').find(
    {
      product_name: { $exists: true, $ne: '' },
      stores: { $exists: true, $ne: '' },
      code: { $exists: true, $ne: '' },
      countries_tags: { $exists: true },
    },
    {
      batchSize: 100000,
      projection: {
        product_name: 1,
        stores: 1,
        code: 1,
        countries_tags: 1,
      },
    }
  );
  while (cursor.hasNext) {
    const obj = await cursor.next();
    const stores: string[] = obj.stores.replace(', ', ',').split(',');
    const countries: string[] = obj.countries_tags.map(tag => tag.slice(3));
    if (countries.length === 0) {
      countries.push('');
    }
    const productRelations: string[] = [];
    const storeCreation = stores.reduce((acc, storeName, sI) => {
      const newStores = countries
        .map((country, cI) => {
          productRelations.push(`MERGE (s${sI + '_' + cI})-[:SELL]->(p)`);
          return `MERGE (s${sI + '_' + cI}:Store { name: "${storeName.toLowerCase()}", country: "${country}"})
        `;
        })
        .join('\n');
      return `${acc}${newStores}`;
    }, '');
    const toRun = `
        MERGE (p:Product { code: "${obj.code}", name: "${sanitizeProductName(obj.product_name)}"})
        ${storeCreation}${productRelations.join('\n')}
      `;
    await session.run(toRun);
  }
  mongoClient.close();
  session.close();
  driver.close();
};

const sanitizeProductName = (name: string) => {
  return name.replace(/[".*+?^${}()|[\]\\]/g, ' ')
}

main();
