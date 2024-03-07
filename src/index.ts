import {
	TwitterOpenApi
} from "twitter-openapi-typescript";
import { ImageResponse } from "workers-og";
import { loadGoogleFont } from "./font";
import getNormalComponent from "./twitter-snap";

export interface Env {

}


export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const pathArray = url.pathname.split('/');
		const id = pathArray[1];

		TwitterOpenApi.fetchApi = fetch.bind(globalThis);
		const api = await new TwitterOpenApi().getGuestClient();
		const tweet = await api.getDefaultApi().getTweetResultByRestId({
			tweetId: id,
		});
		return new ImageResponse(getNormalComponent({ data: tweet.data!, video: false, width: 600 }), {
			format: "png",
			width: 600,
			height: "auto",
			fonts: [
				{
					name: "Noto Sans JP",
					data: await loadGoogleFont({ family: "Noto Sans JP", weight: 600 }),
					weight: 500,
					style: "normal",
				},
			],
		});
	},
};
