// https://github.com/kvnang/workers-og/blob/main/packages/workers-og/src/font.ts

// Copyright(c) 2023 Kevin Ang
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files(the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and / or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


export async function loadGoogleFont({
    family,
    weight,
    text,
}: {
    family: string;
    weight?: number;
    text?: string;
}) {
    const params: Record<string, string> = {
        family: `${encodeURIComponent(family)}${weight ? `:wght@${weight}` : ""}`,
    };

    if (text) {
        params.text = text;
    } else {
        params.subset = "latin";
    }

    const url = `https://fonts.googleapis.com/css2?${Object.keys(params)
        .map((key) => `${key}=${params[key]}`)
        .join("&")}`;

    // @ts-expect-error - CacheStorage would use dom lib, but we're referring to CF worker's lib
    const cache = caches.default;
    const cacheKey = url;
    let res = await cache.match(cacheKey);

    if (!res) {
        res = await fetch(`${url}`, {
            headers: {
                // construct user agent to get TTF font
                "User-Agent":
                    "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
            },
        });

        res = new Response(res.body, res);
        res.headers.append("Cache-Control", "s-maxage=3600");

        await cache.put(cacheKey, res.clone());
    }

    const body = await res.text();
    // Get the font URL from the CSS text
    const fontUrl = body.match(
        /src: url\((.+)\) format\('(opentype|truetype)'\)/
    )?.[1];

    if (!fontUrl) {
        throw new Error("Could not find font URL");
    }

    return fetch(fontUrl).then((res) => res.arrayBuffer());
}