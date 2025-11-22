globalThis.openNextDebug = false;globalThis.openNextVersion = "3.9.0";

// node_modules/.pnpm/@opennextjs+cloudflare@1.13.1_wrangler@4.50.0/node_modules/@opennextjs/cloudflare/dist/api/durable-objects/sharded-tag-cache.js
import { DurableObject } from "cloudflare:workers";

// node_modules/.pnpm/@opennextjs+cloudflare@1.13.1_wrangler@4.50.0/node_modules/@opennextjs/cloudflare/dist/api/cloudflare-context.js
var cloudflareContextSymbol = Symbol.for("__cloudflare-context__");

// node_modules/.pnpm/@opennextjs+cloudflare@1.13.1_wrangler@4.50.0/node_modules/@opennextjs/cloudflare/dist/api/overrides/internal.js
var debugCache = (name, ...args) => {
  if (process.env.NEXT_PRIVATE_DEBUG_CACHE) {
    console.log(`[${name}] `, ...args);
  }
};

// node_modules/.pnpm/@opennextjs+cloudflare@1.13.1_wrangler@4.50.0/node_modules/@opennextjs/cloudflare/dist/api/durable-objects/sharded-tag-cache.js
var DOShardedTagCache = class extends DurableObject {
  sql;
  constructor(state, env) {
    super(state, env);
    this.sql = state.storage.sql;
    state.blockConcurrencyWhile(async () => {
      this.sql.exec(`CREATE TABLE IF NOT EXISTS revalidations (tag TEXT PRIMARY KEY, revalidatedAt INTEGER)`);
    });
  }
  async getLastRevalidated(tags) {
    try {
      const result = this.sql.exec(`SELECT MAX(revalidatedAt) AS time FROM revalidations WHERE tag IN (${tags.map(() => "?").join(", ")})`, ...tags).toArray();
      const timeMs = result[0]?.time ?? 0;
      debugCache("DOShardedTagCache", `getLastRevalidated tags=${tags} -> time=${timeMs}`);
      return timeMs;
    } catch (e) {
      console.error(e);
      return 0;
    }
  }
  async hasBeenRevalidated(tags, lastModified) {
    const revalidated = this.sql.exec(`SELECT 1 FROM revalidations WHERE tag IN (${tags.map(() => "?").join(", ")}) AND revalidatedAt > ? LIMIT 1`, ...tags, lastModified ?? Date.now()).toArray().length > 0;
    debugCache("DOShardedTagCache", `hasBeenRevalidated tags=${tags} -> revalidated=${revalidated}`);
    return revalidated;
  }
  async writeTags(tags, lastModified) {
    debugCache("DOShardedTagCache", `writeTags tags=${tags} time=${lastModified}`);
    tags.forEach((tag) => {
      this.sql.exec(`INSERT OR REPLACE INTO revalidations (tag, revalidatedAt) VALUES (?, ?)`, tag, lastModified);
    });
  }
  async getRevalidationTimes(tags) {
    const result = this.sql.exec(`SELECT tag, revalidatedAt FROM revalidations WHERE tag IN (${tags.map(() => "?").join(", ")})`, ...tags).toArray();
    return Object.fromEntries(result.map((row) => [row.tag, row.revalidatedAt]));
  }
};
export {
  DOShardedTagCache
};
