import * as bodyParser from 'body-parser';
import * as express from 'express';
import { ApolloServer, mergeSchemas } from 'apollo-server-express';
import { MongoClient } from 'mongodb';
import { v1 as Neo } from 'neo4j-driver';

// import { router as apiRouter } from './api/router';
import { neo4jSchema } from './neo4j-typedefs';
import { mongoSchema } from './mongodb-typedefs';
import { linkResolvers, linkTypeDefs } from './link-typedefs';

const app = express();

export const appFactory = _ => {
  app.options('*', (_, res) => res.sendStatus(200));
  app.post('*', bodyParser.json());

  // app.use('/api', apiRouter({}));

  const mergedSchema = mergeSchemas({
    schemas: [neo4jSchema, mongoSchema, linkTypeDefs],
    resolvers: linkResolvers,
    onTypeConflict: (_left, right) => { console.log("conflict!"); return right},
  });
  const apolloServer = new ApolloServer({
    schema: mergedSchema,
    context: {
      driver: Neo.driver('bolt://localhost', Neo.auth.basic('neo4j', 'admin')),
      col: new MongoClient('mongodb://localhost:27017', { useNewUrlParser: true })
        .connect()
        .then(client => client.db('cb-v2').collection('localStores')),
    },
  });
  apolloServer.applyMiddleware({ app });

  app.use((err, _, res, next) => {
    if (res.headersSent) {
      return next(err);
    }
    console.error(err);
    res.sendStatus(500);
  });

  return app;
};
