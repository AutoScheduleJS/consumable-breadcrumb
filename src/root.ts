import * as bodyParser from 'body-parser';
import * as express from 'express';
import { ApolloServer } from 'apollo-server-express';
// import { router as apiRouter } from './api/router';
import { schema } from './graphql/typedefs';
import { v1 as Neo } from 'neo4j-driver';

const app = express();

export const appFactory = _ => {
  app.options('*', (_, res) => res.sendStatus(200));
  app.post('*', bodyParser.json());

  // app.use('/api', apiRouter({}));

  const apolloServer = new ApolloServer({
    schema,
    context: {
      driver: Neo.driver('bolt://localhost', Neo.auth.basic('neo4j', 'admin')),
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
