/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { Hono } from 'hono';
import { banners } from './module/scraper/banner.ts';
import { character, characters } from './module/scraper/character.ts';

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
}

globalThis.process = { env: { } }

const app = new Hono<{ Bindings: Env }>();

app.get("/scraper/banner", async (c) => {
    return c.json(await banners());
});

app.get("/scraper/characters", async (c) => {
    return c.json(await characters());
});

app.get("/scraper/character/:name", async (c) => {
    return c.json(await character(c.req.param().name, c.req.query("element") ?? undefined));
});

app.get("/", (c) => c.text("Hello! Genshin!"));

export default {
    fetch: app.fetch,
    scheduled: async (event, env, context) => {

    }
};