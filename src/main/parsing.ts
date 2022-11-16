import { Option, TweetMedia, TweetURLs } from "../types.ts";

export function parseUrls(json: any): Option<TweetURLs[]> {
    let urlsJson: any[] | undefined = json["entities"]?.["urls"];
    if (urlsJson === undefined) { return null }
    let urls: TweetURLs[] = [];
    for (let urlJson of urlsJson) {
        let item = {
            shortenedUrl: urlJson["url"],
            fullUrl: urlJson["expanded_url"],
        };
        urls.push(item);
    }
    return urls
}

export function parseMedia(json: any): Option<TweetMedia[]> {
    let mediaJson: any[] = json["extended_entities"]?.["media"];
    if (mediaJson !== undefined) {
        let media: TweetMedia[] = [];
        for (let item of mediaJson) {
            let shortenedImgUrl = item["url"];
            let fullImgUrl = item["media_url_https"];
            let kind = item["type"];
            let videoUrl: Option<string> = null;
            if (kind === "video") {
                let variants: any[] = item["video_info"]["variants"];
                let highestBitrate = 0;
                let highestBitrateMp4Url = "";
                for (let variant of variants) {
                    let bitrate: number = variant["bitrate"] ?? 0;
                    if (bitrate > highestBitrate) {
                        highestBitrate = bitrate;
                        highestBitrateMp4Url = variant["url"];
                    }
                }
                videoUrl = highestBitrateMp4Url;
            } else if (kind === "animated_gif") {
                videoUrl = item["video_info"]["variants"][0]["url"];
            }
            let mediaItem = {
                shortenedImgUrl,
                fullImgUrl,
                kind,
                videoUrl,
            };
            media.push(mediaItem);
        }
        return media;
    } else {
        return null;
    }
}