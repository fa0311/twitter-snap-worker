import { ImageResponse } from '@cloudflare/pages-plugin-vercel-og/api';
import { Hono } from 'hono';
import { TwitterOpenApi } from 'twitter-openapi-typescript';
import { themeList } from 'twitter-snap-core';
import { getFonts } from './fonts';

export interface Env {
	CSRF_TOKEN: string;
	AUTH_TOKEN: string;
}

const app = new Hono();

app.get('/:id', async (c) => {
	const cache = caches.default;
	const cacheKey = c.req.url;
	const res = await cache.match(cacheKey);

	const id = c.req.param('id');
	const theme = c.req.query('theme');

	if (res) {
		return res;
	} else {
		TwitterOpenApi.fetchApi = fetch.bind(globalThis);
		TwitterOpenApi.api_key['accept-encoding'] = 'identity';

		const api = await new TwitterOpenApi().getClientFromCookies({
			ct0: c.env!.CSRF_TOKEN as string,
			auth_token: c.env!.AUTH_TOKEN as string,
		});
		const tweet = await api.getTweetApi().getTweetDetail({
			focalTweetId: id,
		});

		const Theme = (Object.entries(themeList).find(([k, _]) => k === theme) ?? Object.entries(themeList)[0])[1];

		const render = new Theme({
			width: 650,
			video: false,
		});

		const fonts = await getFonts();

		const data = await render.imageRender({ data: tweet.data.data[0]! });

		const res = new ImageResponse(data, {
			width: 650,
			height: undefined,
			emoji: 'twemoji',
			fonts,
		});
		await cache.put(cacheKey, res.clone());
		res.headers.append('Cache-Control', 's-maxage=3600');
		return res;
	}
});

export default app;
