export const getFonts = async () => {
	const base = 'https://github.com/fa0311/twitter-snap-core/releases/download/assets-fonts/';

	const list = [
		['SEGOEUISL.TTF', 'segoeui', 500, 'normal'] as const,
		['SEGOEUIB.TTF', 'segoeui', 700, 'normal'] as const,
		['SEGUISLI.TTF', 'segoeui', 500, 'italic'] as const,
		['SEGOEUIZ.TTF', 'segoeui', 700, 'italic'] as const,
	];

	const fonts = list.map(async ([file, name, weight, style]) => {
		const url = `${base}${file}`;
		const cache = caches.default;
		const cacheKey = url;
		const res = await cache.match(cacheKey);
		if (res) {
			const data = await res.arrayBuffer();
			return { data, name, style, weight };
		} else {
			const res = await fetch(url);
			const data = await res.arrayBuffer();
			await cache.put(cacheKey, new Response(data, { status: 200 }));
			return { data, name, style, weight };
		}
	});

	return Promise.all(fonts);
};
