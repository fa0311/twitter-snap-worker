declare module '@cloudflare/pages-plugin-vercel-og/api' {
	import { ImageResponse as VercelImageResponse } from '@vercel/og';
	export declare class ImageResponse extends Response {
		constructor(...args: ConstructorParameters<typeof VercelImageResponse>);
	}
}
