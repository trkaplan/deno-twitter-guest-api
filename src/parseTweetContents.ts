import { Tweet, TweetMedia, TweetURLs, Quote } from "./types.ts";

export function parseTweetContents(tweetContents: any): Tweet | Quote | null {

    tweetContents = tweetContents.itemContent?.tweet_results?.result
                    // handle quote tweet (if normal tweet (above) returns null)
                    || tweetContents.quoted_status_result.result

    // if the tweetItem is a "Show more" button, it has no .result, so 
    // above will return null. if null, it's not a tweet, so return null
    if (tweetContents === undefined) {
        return null
    }

    const mainTweet: Tweet | Quote = {
        id: tweetContents.legacy.id_str,
        user: tweetContents.core.user_results.result.legacy.screen_name,
        text: tweetContents.legacy.full_text,
    }
    // console.log(mainTweet.text)
    const media = tweetContents.legacy.entities?.media;
    if (media) {
        mainTweet.media = []
        for (const img of media) {
            const item: TweetMedia = {
                shortenedImgURL: img.url,
                fullImgURL: img.media_url_https,
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
                shortenedURL: url.url,
                fullURL: url.expanded_url,
            }
            mainTweet.urls.push(item);
        }
    }
    const isQuote = tweetContents?.quoted_status_result
    if (isQuote) {
        const quote: Quote | null = parseTweetContents(tweetContents);
        if (quote) {
            mainTweet.quote = quote;
            // not sure y tf i need these 2 lines of code ?????
            // mainTweet.quote.url = tweetContents.legacy.quoted_status_permalink
            // delete mainTweet.quote.url.display
        }
        
    }
    return mainTweet;
}