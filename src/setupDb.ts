import { v1 as Neo } from 'neo4j-driver';
import { MongoClient } from 'mongodb';

const main = async () => {
  const driver = Neo.driver('bolt://localhost', Neo.auth.basic('neo4j', 'admin'));
  const session = driver.session();
  const mongoClient = new MongoClient('mongodb://localhost:27017', { useNewUrlParser: true });
  await mongoClient.connect();
  const db = mongoClient.db('off');

  await db.collection('products').find({}, {
    batchSize: 100000,
    limit: 1000,
    projection: {
      'product_name': 1,
      'stores': 1,
      'code': 1,
      'ingredients_text': 1
    }
  }).forEach(obj => {
    console.log(obj);
  });

  mongoClient.close();
  driver.close();
};

main();
