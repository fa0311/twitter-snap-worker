import {
	TwitterOpenApi
} from "twitter-openapi-typescript";
import { ImageResponse, loadGoogleFont } from "workers-og";
import getNormalComponent from "./twitter-snap";

export interface Env {

}


export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const pathArray = url.pathname.split('/');
		const id = pathArray[1];

		const cache = caches.default;
		const cacheKey = request.url;
		let res = await cache.match(cacheKey);

		if (res) {
			return res;
		} else {
			TwitterOpenApi.fetchApi = fetch.bind(globalThis);
			const api = await new TwitterOpenApi().getGuestClient();
			const tweet = await api.getDefaultApi().getTweetResultByRestId({
				tweetId: id,
			});
			const res = new ImageResponse(getNormalComponent({ data: tweet.data!, video: false, width: 600 }), {
				format: "png",
				width: 600,
				emoji: "twemoji",
				fonts: [
					{
						name: "Noto Sans JP",
						data: await loadGoogleFont({ family: "Noto Sans JP", weight: 400 }),
						weight: 400,
						style: "normal"
					},
					{
						name: "Noto Sans JP",
						data: await loadGoogleFont({ family: "Noto Sans JP", weight: 700 }),
						weight: 700,
						style: "normal"
					},
				],
			});
			await cache.put(cacheKey, res.clone());
			res.headers.append("Cache-Control", "s-maxage=3600");
			return res;
		}
	},
};
