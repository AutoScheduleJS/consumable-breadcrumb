import { config } from './config';
import { appFactory } from './root';

const app = appFactory({});

app.listen(config.express.port, config.express.ip, error => {
  if (error) {
    console.error('Unable to listen for connections', error);
    process.exit(10);
  }
  console.info(`express is listening on http://${config.express.ip}:${config.express.port}`);
});
