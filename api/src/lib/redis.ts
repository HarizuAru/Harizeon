import Redis from "ioredis";
import { config } from "../config";

/** Shared Redis client (queue, heartbeats, cancel flags). */
export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableOfflineQueue: true,
  // Connect on first command, not at import — so modules (and tests) that never
  // touch Redis do not hold an open socket.
  lazyConnect: true,
});
