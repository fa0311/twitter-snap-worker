/* eslint-disable @next/next/no-img-element */


/* https://github.com/fa0311/twitter-snap/blob/master/src/theme/normalComponent.tsx */

// MIT License
// Copyright(c) 2023 yuki
//     < https://yuki0311.com/>
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files(the "Software"), to deal
//     in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and / or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.


import split from "graphemesplit";
import React from "react";
import {
    MediaExtended,
    NoteTweetResultRichTextTagRichtextTypesEnum as RichtextTypesEnum
} from "twitter-openapi-typescript-generated";

import { ReactElement } from "react";
import { TweetApiUtilsData } from "twitter-openapi-typescript";



export type Component = (props: {
    data: TweetApiUtilsData;
    video: boolean;
    width: number;
}) => ReactElement;


export const getBiggerMedia = (
    extMedia: MediaExtended[],
    margin: number,
    width: number
) => {
    const video = extMedia.filter((e) => e.type !== "photo");
    const sorted = [...video].sort(
        (a, b) =>
            b.videoInfo!.aspectRatio[1] / b.videoInfo!.aspectRatio[0] -
            a.videoInfo!.aspectRatio[1] / a.videoInfo!.aspectRatio[0]
    );
    if (sorted.length === 0) return { width: 0, height: 0, index: 0 };

    const [aspectWidth, aspectHeight] = sorted[0].videoInfo!.aspectRatio;
    const w = width - margin * 2;
    const h = (w / aspectWidth) * aspectHeight;
    return { width: w, height: h, index: extMedia.indexOf(sorted[0]) };
};

const TweetComponent: Component = ({ data, video, width }) => {
    const note = data.tweet.noteTweet?.noteTweetResults.result;
    const legacy = data.tweet.legacy!;

    const text = note?.text ?? legacy.fullText;

    const noteEntity = note?.entitySet;
    const legacySet = data.tweet.legacy!.entities;
    const extEntities = legacy.extendedEntities;

    const inlineMedia = note?.media?.inlineMedia ?? [];
    const richtextTags = note?.richtext?.richtextTags ?? [];

    const biggerMedia = getBiggerMedia(extEntities?.media ?? [], 20, width);

    const normalizeMap: {
        array: number;
        str: number;
    }[] = [{ array: 0, str: 0 }];

    const trueSplit = split(text).map((char, index) => ({ char, index }));

    trueSplit.forEach(({ char }) => {
        const last = normalizeMap[normalizeMap.length - 1];
        normalizeMap.push({
            array: Array.from(char).length + last.array,
            str: char.length + last.str,
        });
    });

    const normalizeRichtextTags = richtextTags.map(
        ({ fromIndex, toIndex, richtextTypes }) => ({
            start: normalizeMap.findIndex(({ str }) => str === fromIndex),
            end: normalizeMap.findIndex(({ str }) => str === toIndex),
            type: richtextTypes,
        })
    );

    const normalizeInlineMedia = inlineMedia.map(({ index, mediaId }) => ({
        index: normalizeMap.findIndex(({ str }) => str === index),
        mediaId,
    }));

    const normalizeHashtags = [
        ...(noteEntity?.hashtags ?? []),
        ...(legacySet?.hashtags ?? []),
    ].map(({ indices, tag }) => ({
        start: normalizeMap.findIndex(({ array }) => array === indices[0]),
        end: normalizeMap.findIndex(({ array }) => array === indices[1]),
        tag,
    }));

    const normalizeMedia = [...(extEntities?.media ?? [])].map(
        ({ indices, idStr, mediaUrlHttps, type }) => ({
            start: normalizeMap.findIndex(({ array }) => array === indices[0]),
            end: normalizeMap.findIndex(({ array }) => array === indices[1]),
            remove: video && type !== "photo",
            idStr,
            mediaUrlHttps,
        })
    );
    const normalizeNoteMedia = [...(noteEntity?.media ?? [])].map(
        ({ indices, idStr, mediaUrlHttps, type }) => ({
            start: normalizeMap.findIndex(({ array }) => array === indices[0]),
            end: normalizeMap.findIndex(({ array }) => array === indices[1]),
            remove: video && type !== "photo",
            idStr,
            mediaUrlHttps,
        })
    );

    const normalizeUrls = [
        ...(noteEntity?.urls ?? []),
        ...(legacySet?.urls ?? []),
    ].map(({ indices, displayUrl }) => ({
        start: normalizeMap.findIndex(({ array }) => array === indices[0]),
        end: normalizeMap.findIndex(({ array }) => array === indices[1]),
        displayUrl,
    }));

    const normalizeUserMentions = [
        ...(noteEntity?.userMentions ?? []),
        ...(legacySet?.userMentions ?? []),
    ].map(({ indices, screenName }) => ({
        start: normalizeMap.findIndex(({ array }) => array === indices[0]),
        end: normalizeMap.findIndex(({ array }) => array === indices[1]),
        screenName,
    }));

    const charIndices: {
        start: number;
        end: number;
        chars: string[];
    }[] = [];

    const insert: {
        index: number;
        fn: () => React.ReactElement;
    }[] = [];

    normalizeMedia.forEach((m) => {
        const inline = normalizeInlineMedia.find(
            ({ mediaId }) => mediaId === m.idStr
        );

        if (m.remove) {
            charIndices.push({
                start: m.start,
                end: m.end,
                chars: [],
            });
        } else if (inline) {
            insert.push({
                index: inline.index,
                fn: () => (
                    <img
                        key={m.idStr}
                        alt="img"
                        style={{
                            width: "100%",
                            borderRadius: "10px",
                            border: "1px solid #e6e6e6",
                        }}
                        src={m.mediaUrlHttps}
                    />
                ),
            });
        } else if (note) {
            insert.push({
                index: trueSplit.length,
                fn: () => (
                    <img
                        key={m.idStr}
                        alt="img"
                        style={{
                            width: "100%",
                            borderRadius: "10px",
                            border: "1px solid #e6e6e6",
                        }}
                        src={m.mediaUrlHttps}
                    />
                ),
            });
        } else {
            charIndices.push({
                start: m.start,
                end: m.end,
                chars: [],
            });
            insert.push({
                index: m.start,
                fn: () => (
                    <img
                        key={m.idStr}
                        alt="img"
                        style={{
                            width: "100%",
                            borderRadius: "10px",
                            border: "1px solid #e6e6e6",
                        }}
                        src={m.mediaUrlHttps}
                    />
                ),
            });
        }
    });

    normalizeUrls.forEach(({ start, end, displayUrl }) => {
        charIndices.push({
            start: start,
            end: end,
            chars: split(displayUrl),
        });
    });

    if (biggerMedia && video) {
        insert.push({
            index: trueSplit.length,
            fn: () => (
                <div
                    key={"biggerMedia"}
                    style={{
                        width: biggerMedia.width,
                        height: biggerMedia.height,
                    }}
                ></div>
            ),
        });
    }

    const replacedSplit: typeof trueSplit = [];
    trueSplit.forEach(({ char, index }) => {
        const ignore = charIndices.some(
            ({ start, end }) => start <= index && index < end
        );
        if (ignore) {
            const start = charIndices.find(({ start }) => start === index);
            start?.chars.forEach((c) => replacedSplit.push({ char: c, index }));
        } else {
            replacedSplit.push({ char, index });
        }
    });

    const charDataList = replacedSplit.map(({ char, index }) => {
        const link = [...normalizeHashtags, ...normalizeUrls].some(
            ({ start, end }) => start <= index && index < end
        );
        const bold = normalizeRichtextTags.some(
            ({ start, end, type }) =>
                start <= index && index < end && type.includes(RichtextTypesEnum.Bold)
        );
        const italic = normalizeRichtextTags.some(
            ({ start, end, type }) =>
                start <= index && index < end && type.includes(RichtextTypesEnum.Italic)
        );

        return {
            char: char,
            index: index,
            properties: {
                ...(link ? { color: "#1d9bf0" } : {}),
                ...(bold ? { fontWeight: "700" } : {}),
                ...(italic ? { italic: "italic" } : {}),
            },
        };
    }, [] as { char: string; properties: React.CSSProperties }[]);

    const textDataList: {
        start: number;
        end: number;
        data: { char: string; properties: React.CSSProperties }[];
    }[] = [];

    charDataList.forEach((data) => {
        const index = data.index;
        const split = insert.some((i) => i.index === index);

        if (split || index === 0) {
            textDataList.push({
                start: index,
                end: index + 1,
                data: [data],
            });
        } else {
            const last = textDataList.pop()!;
            textDataList.push({
                start: last.start,
                end: index,
                data: [...last.data, data],
            });
        }
    });

    // console.log("insert", insert);
    // console.log("charIndices", charIndices);
    // console.log("textDataList", textDataList);
    // console.log("data", data);

    const textElement: React.ReactElement[] = [];

    textDataList.forEach((t, i) => {
        textElement.push(
            <p
                key={i}
                style={{
                    fontSize: "17px",
                    margin: "0px",
                    width: "100%",
                    display: "flex",
                    flexWrap: "wrap",
                }}
            >
                {t.data.map(({ char, properties }, i) => (
                    <span
                        key={i}
                        style={{
                            ...properties,
                            ...(char == "\n" ? { width: "100%" } : {}),
                            ...(char == " " ? { width: "0.25em" } : {}),
                            ...(char == "\n" && t.data[i - 1]?.char == "\n"
                                ? { height: "1em" }
                                : {}),
                        }}
                    >
                        {char}
                    </span>
                ))}
            </p>
        );

        insert
            .filter(({ index }) => t.start <= index && index < t.end)
            .forEach(({ fn }) => textElement.push(fn()));
    });

    const last = textDataList[textDataList.length - 1]?.end ?? 0;
    insert
        .filter(({ index }) => index >= last)
        .forEach(({ fn }) => textElement.push(fn()));

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "12px",
            }}
        >
            {textElement}
        </div>
    );
};

const NormalComponent: Component = ({ data, video, width }) => {
    const icon = data.user.legacy.profileImageUrlHttps;
    const name = data.user.legacy.name;
    const id = data.user.legacy.screenName;
    const lang = data.tweet.legacy!.lang;

    return (
        <div
            lang={lang}
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "100%",
                padding: 20,
                background:
                    "linear-gradient(-45deg, #0077F2ee 0%, #1DA1F2ee 50%,#4CFFE2ee 100%)",
            }}
        >
            <div
                style={{
                    width: "100%",
                    background: "white",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "10px",
                    padding: "12px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                    }}
                >
                    <img
                        alt="icon"
                        style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            marginRight: "12px",
                        }}
                        src={icon}
                    />
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <p
                            style={{
                                fontSize: "15px",
                                fontWeight: "700",
                                margin: "0px",
                            }}
                        >
                            {name}
                        </p>
                        <p
                            style={{
                                fontSize: "15px",
                                margin: "0px",
                                color: "#536471",
                            }}
                        >
                            @{id}
                        </p>
                    </div>
                </div>
                <TweetComponent data={data} video={video} width={width} />
            </div>
        </div>
    );
};



const getNormalComponent: Component = ({ data, video, width }) => {
    return (<NormalComponent data={data} video={video} width={width} />);
}

export default getNormalComponent;