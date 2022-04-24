import { Tweet, TweetMedia, TweetURLs, Quote } from "./types.ts";

export function parseTweetContents(tweetContents: any): Tweet | Quote {
    const mainTweet: Tweet | Quote = {
        id: tweetContents.legacy.id_str,
        user: tweetContents.core.user_results.result.legacy.screen_name,
        text: tweetContents.legacy.full_text,
    }
    const media = tweetContents.legacy.entities?.media;
    if (media) {
        mainTweet.media = []
        for (const img of media) {
            const item: TweetMedia = {
                twitterLink: img.url,
                url: img.media_url_https,
                type: img.type, // photo or video
            }
            mainTweet.media.push(item);
        }
    }
    const urls = tweetContents.legacy.entities.urls;
    if (urls?.length > 0) {
        mainTweet.urls = [];
        for (const url of urls) {
            const item: TweetURLs = {
                twitterLink: url.url,
                url: url.expanded_url,
            }
            mainTweet.urls.push(item);
        }
    }
    const isQuote = tweetContents?.quoted_status_result
    if (isQuote) {
        const quoteContents = tweetContents.quoted_status_result.result
        mainTweet.quote = parseTweetContents(quoteContents)
        mainTweet.quote.url = tweetContents.legacy.quoted_status_permalink
        delete mainTweet.quote.url.display
    }
    return mainTweet;
}