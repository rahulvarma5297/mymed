import { REDIS_PASSWORD, REDIS_URL, REDIS_USERNAME, REDIS_DB } from '@/config';
import { createClient } from 'redis';
//Initialized redis client

const redisClient = createClient({
  url: REDIS_URL,
  database: REDIS_DB,
});

redisClient
  .connect()
  .then(() => console.log('Redis connected'))
  .catch(err => console.log(err));

export default redisClient;
