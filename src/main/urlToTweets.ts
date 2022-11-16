import { Tweet, Option, FetchFn } from "../types.ts";
import { idToUnparsedTweets } from "../fetch/idToUnparsedTweets.ts";
import { defaultFetch } from "../fetch/defaultFetch.ts";
import { parseMedia, parseUrls } from "./parsing.ts";

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function urlToTweets(
    url: string,
    fetchFn: FetchFn = defaultFetch
): Promise<Tweet[]> {
    const tweetId = url.split("/")[5];
    let tweets: Tweet[] = await urlToTweetsNoCursorPosition(tweetId, fetchFn);
    let lastTweet = tweets[tweets.length -1];
    while (lastTweet.id === "more_tweets_in_thread") {
        let cursor: string = lastTweet.text;
        tweets.pop();
        sleep(100);
        let showMoreTweets = await urlToTweetsWithCursorPosition(tweetId, cursor, fetchFn);
        let existingTweetIds = tweets.map(t => t.id);
        for (let showMoreTweet of showMoreTweets) {
            if (! existingTweetIds.includes(showMoreTweet.id)) {
                tweets.push(showMoreTweet);
            }
        }
        lastTweet = tweets[tweets.length -1];
    }
    return tweets
}

async function urlToTweetsWithCursorPosition(
    tweetId: string,
    cursor: string,
    fetchFn: FetchFn
): Promise<Tweet[]> {
    let tweetGroupsJson = await idToUnparsedTweets(tweetId, cursor, false, fetchFn);
    let tweetGroup: any[] = tweetGroupsJson;
    return tweetGroupToTweets(tweetGroup);
}

async function urlToTweetsNoCursorPosition(
    tweetId: string,
    fetchFn: FetchFn
): Promise<Tweet[]> {
    let tweetGroups: any[] = await idToUnparsedTweets(tweetId, "", false, fetchFn);
    let mainTweetIndex: number = getMainTweetIndex(tweetGroups, tweetId);
    let mainGroupTweets: Tweet[] = tweetGroupToTweetOrTweets(tweetGroups[mainTweetIndex]);
    let nextGroupTweets: Tweet[] = [];
    let nextGroup = tweetGroups[mainTweetIndex + 1];
    if (nextGroup !== undefined) {
        nextGroupTweets = tweetGroupToTweetOrTweets(nextGroup);
    }
    if (mainTweetIndex == 0) {
        if (nextGroupTweets.length > 0 && nextGroupTweets[0].user == mainGroupTweets[0].user) {
            mainGroupTweets.push(...nextGroupTweets);
        }
        return mainGroupTweets;
    }
    let prevGroupTweets: Tweet[] = tweetGroupToTweetOrTweets(tweetGroups[mainTweetIndex - 1]);
    let prevTweetIsSameUser: boolean = prevGroupTweets[0].user === mainGroupTweets[0].user;
    if (prevTweetIsSameUser) {
        return mainGroupTweets;
    } else {
        if (nextGroupTweets.length > 0 && nextGroupTweets[0].user == mainGroupTweets[0].user) {
            mainGroupTweets.push(...nextGroupTweets);
        }
        return mainGroupTweets;
    }
}

function getMainTweetIndex(tweetGroups: any[], tweetId: string): number {
    for (let [i, tweetGroup] of tweetGroups.entries()) {
        let entryId: string = tweetGroup["entryId"];
        let id = entryId.substring(6);
        if (id === tweetId) {
          return i;
        }
    }
    return 0;
}

function tweetGroupToTweetOrTweets(tweetGroup: any): Tweet[] {
    let contents: any[] | undefined = tweetGroup["content"]?.["items"];
    if (contents !== undefined) {
        return tweetGroupToTweets(contents);
    } else {
        let tweet: Option<Tweet> = parseTweetContents(tweetGroup["content"]["itemContent"]);
        if (tweet !== null ) {
            return [tweet];
        } else {
            return [];
        }
    }
}

export function tweetGroupToTweets(tweetGroup: any[]): Tweet[] {
    return tweetGroup.map((tweetItem: any) =>  {
        let tweet = parseTweetContents(tweetItem["item"]["itemContent"]);
        if (tweet !== null) {
            return tweet
        } else {
            throw "tweet missing"
        }
    })
}

function parseTweetContents(unparsedTweet: any): Option<Tweet> {
    const tempUnparsedTweet = unparsedTweet["tweet_results"]?.["result"] ?? unparsedTweet["result"];
    if (tempUnparsedTweet !== undefined) {
        unparsedTweet = tempUnparsedTweet;
        let kind = itemType(unparsedTweet);
        switch (kind) {
            case "Tweet": break;
            case "TweetWithVisibilityResults":
                unparsedTweet = unparsedTweet["tweet"];
                break;
            case "TweetTombstone":
                return createMissingTweet(unparsedTweet);
            default: 
                throw `idk what type this is: ${kind}`
        }
    } else {
        let kind = itemType(unparsedTweet);
        if (kind === "TimelineTimelineCursor") {
            let showMoreCursor: string = unparsedTweet["value"];
            return {
                id: "more_tweets_in_thread",
                user: "",
                text: showMoreCursor,
            };
        } else {
            return null;
        }
    };
    let id = unparsedTweet["legacy"]["id_str"];
    let user = unparsedTweet["core"]["user_results"]["result"]["legacy"]["screen_name"];
    let text = unparsedTweet["legacy"]["full_text"];
    let media = parseMedia(unparsedTweet["legacy"]);
    let urls = parseUrls(unparsedTweet["legacy"]);
    let quote = null;
    let quoteContents = unparsedTweet["quoted_status_result"];
    if (quoteContents !== undefined) {
        let tweet = parseTweetContents(quoteContents);
        if (tweet !== null) {
            quote = tweet;
        }
    }
    return { id, user, text, media, urls, quote };
}

function itemType(item: any): string {
    if (item === undefined) { throw "idk" }
    let type: string | undefined = item["entryType"] ?? item["itemType"] ?? item["__typename"];
    if (type === undefined) {
        throw `can't find type:\n${item}`
    }
    return type
}
  
function createMissingTweet(unparsedTweet: any): Option<Tweet> {
    let txt: string = unparsedTweet["tombstone"]["text"]["text"];
    return { 
        id: "",
        user: "unknown",
        text: `<<< ${txt.slice(0, txt.length - 11)} >>>`,
    }
}

