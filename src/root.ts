import * as bodyParser from 'body-parser';
import * as express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { router as apiRouter } from './api/router';
import { typeDefs, resolvers } from './graphql/typedefs';

const app = express();

export const appFactory = _ => {
  app.options('*', (_, res) => res.sendStatus(200));
  app.post('*', bodyParser.json());

  app.use('/api', apiRouter({}));

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
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
