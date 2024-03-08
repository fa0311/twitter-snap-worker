import {
	TwitterOpenApi
} from "twitter-openapi-typescript";
import { ImageResponse, loadGoogleFont } from "workers-og";
import getNormalComponent from "./twitter-snap";

export interface Env {
	CSRF_TOKEN: string;
	AUTH_TOKEN: string;
}



export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const [_, id] = url.pathname.split("/");
		if (id === "favicon.ico") {
			return new Response(null, { status: 404 });
		}
		if (!id) {
			return new Response("OK", { status: 200 });
		}

		const cache = caches.default;
		const cacheKey = request.url;
		const res = await cache.match(cacheKey);

		if (res) {
			return res;
		} else {
			TwitterOpenApi.fetchApi = fetch.bind(globalThis);
			TwitterOpenApi.api_key["accept-encoding"] = "identity";

			const api = await new TwitterOpenApi().getClientFromCookies({
				"ct0": env.CSRF_TOKEN,
				"auth_token": env.AUTH_TOKEN,
			});
			const tweet = await api.getDefaultApi().getTweetResultByRestId({
				tweetId: id,
			});
			console.log("get tweet success");
			const res = new ImageResponse(getNormalComponent({ data: tweet.data!, video: false, width: 600 }), {
				width: 600,
				emoji: "twemoji",
				fonts: [
					{
						name: "Noto Sans JP",
						data: await loadGoogleFont({ family: "Noto Sans JP", weight: 400, text: undefined }),
						weight: 400,
						style: "normal"
					},
					{
						name: "Noto Sans JP",
						data: await loadGoogleFont({ family: "Noto Sans JP", weight: 700, text: undefined }),
						weight: 700,
						style: "normal"
					},
				],
				loadAdditionalAsset: async (languageCode: string, segment: string) => {
					if (languageCode === "emoji") {
						const codePoint = segment.codePointAt(0)?.toString(16);
						const url = `https://cdn.jsdelivr.net/npm/twemoji@latest/2/svg/${codePoint}.svg`;

						const res = await fetch(`${url}`, {
							headers: {
								// construct user agent to get TTF font
								"User-Agent":
									"Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
							},
						});
						if (res === undefined) {
							throw new Error("Failed to fetch font");
						}
						const body = await res.text();
						return `data:image/svg+xml;base64,${btoa(body)}`;
					}
					console.log("loadAdditionalAsset", languageCode, segment);
					return "";
				},
			});
			await cache.put(cacheKey, res.clone());
			res.headers.append("Cache-Control", "s-maxage=3600");
			return res;
		}
	},
};
