import { Tweet } from "../types.ts";
import { getUnparsedTweets } from "../fetch/getUnparsedTweets.ts";
import { parseTweetContents } from "../parseTweetContents.ts";

export async function getRecommendedTweetsFromURL(url: string): Promise<Tweet[]> {

    const idFromInputURL = url.split("/")[5];
    const tweetGroups = await getUnparsedTweets(idFromInputURL, true);
    // console.log(tweetGroups)
    const allParsedTweets: Tweet[] = [];

    // all recommended tweets are in second-last tweetGroup item
    let recommendedTweets = tweetGroups[tweetGroups.length - 2].content.items;
    for (const tweet of recommendedTweets) {
        const tweetContents = tweet.item.itemContent.tweet_results.result;
        const parsedTweet: Tweet = parseTweetContents(tweetContents);
        allParsedTweets.push(parsedTweet);
    }

    return allParsedTweets;
}