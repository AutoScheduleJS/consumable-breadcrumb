import { MongoClient, Db, Cursor } from 'mongodb';
import { v1 as Neo } from 'neo4j-driver';

interface OFFProduct {
  stores: string;
  product_name: string;
  code: string;
  countries_tags: string[];
  packaging_tags: string[];
  categories_tags: string[];
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
    const categories: string[] = obj.categories_tags;
    if (countries.length === 0) {
      countries.push('');
    }
    const toRun = `
        ${buildProduct(obj)}
        ${buildStoresAndRelations(stores, countries)}
        ${buildCategoriesAndRelations(categories)}
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

const buildPreservation = (obj: OFFProduct) => {
  // TODO: use categories_tags: frozen-foods ; canned-foods
  return obj.packaging_tags
    ? ', preservation: ' +
        JSON.stringify(
          obj.packaging_tags.map(packagingTagToPreservation).filter(p => p !== Preservation.none)
        )
    : '';
};

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

// const categoryBlackList = [
//   'plant-based-foods-and-beverages',
//   'plant-based-foods',
//   'fruits-and-vegetables-based-foods',
//   'cereals-and-potatoes',
//   'fermented-foods',
//   'fermented-milk-products',
//   'spreads',
//   'groceries',
//   'cereals-and-their-products',
//   'plant-based-beverages',
//   'fruits-based-foods',
//   'vegetables-based-foods',
//   'plant-based-spreads',
//   'fruit-based-beverages',
//   'fats',
//   'fresh-foods',
//   'meat-based-products',
//   'fruit-preserves',
//   'legumes-and-their-products',
//   'canned-plant-based-foods',
//   'meals-with-meat',
//   'hot-beverages',
//   'nuts-and-their-products',
//   'vegetable-fats',
//   'legumes',
//   'olive-tree-products',
//   'microwave-meals',
//   'meals-with-fish',
//   'nuts',
//   'cereal-grains',
//   '',
//   'dried-plant-based-foods',
//   'artificially-sweetened-beverages',
//   'fruits',
//   'dried-products-to-be-rehydrated',
//   'fresh-plant-based-foods',
//   'fish-and-meat-and-eggs',
//   'plant-based-pickles',
//   'poultry-meals',
//   'preparations-made-from-fish-meat',
//   'fresh-vegetables',
//   'milkfat',
//   'soft-cheeses-with-bloomy-rind',
//   'plant-based-pates',
//   'breaded-products'
// ]

const buildCategoriesAndRelations = (categories: string[]) => {
  categories
    .filter(cat => cat.startsWith('en:') /*&& !categoryBlackList.includes(cat)*/)
    .map((fullCat, i) => {
      const cat = fullCat.slice(3);
      return `MERGE (cat${i}):Category {
      name: "${cat}"
    }
    MERGE (p)-[:BELONGS]->(cat${i})`})
    .join('\n');
};

const retrieveProducts = (db: Db) =>
  db.collection('products').find(
    {
      product_name: { $exists: true, $ne: '' },
      stores: { $exists: true, $ne: '' },
      code: { $exists: true, $ne: '' },
      countries_tags: { $exists: true },
      categories_tags: { $exists: true },
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
