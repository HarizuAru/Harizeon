import { RedisScanQueue, type ScanQueue } from "../lib/queue";
import { redis } from "../lib/redis";
import { config } from "../config";

/** Process-wide queue adapter used by the routes, ingester and reaper. */
export const scanQueue: ScanQueue = new RedisScanQueue(redis, config.HARIZEON_QUEUE_PREFIX);
