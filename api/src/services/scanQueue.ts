import { RedisScanQueue, type ScanQueue } from "../lib/queue";
import { redis } from "../lib/redis";

/** Process-wide queue adapter used by the routes, ingester and reaper. */
export const scanQueue: ScanQueue = new RedisScanQueue(redis);
