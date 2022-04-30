import { Tweet } from "../types.ts";
import { idToUnparsedTweets } from "../fetch/idToUnparsedTweets.ts";
import { parseTweetContents } from "../parseTweetContents.ts";

export async function urlToRecommendedTweets(url: string): Promise<Tweet[]> {

    const idFromInputURL = url.split("/")[5];
    const tweetGroups = await idToUnparsedTweets(idFromInputURL, true);
    // console.log(tweetGroups)
    const allParsedTweets: Tweet[] = [];

    // all recommended tweets are in second-last tweetGroup item
    let recommendedTweets = tweetGroups[tweetGroups.length - 2].content.items;
    for (const tweet of recommendedTweets) {
        const tweetContents = tweet.item;
        const parsedTweet: Tweet | null = parseTweetContents(tweetContents);
        if (parsedTweet) {
            allParsedTweets.push(parsedTweet);
        }
    }

    return allParsedTweets;
}