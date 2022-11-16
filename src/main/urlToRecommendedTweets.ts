import { Tweet, FetchFn } from "../types.ts";
import { idToUnparsedTweets } from "../fetch/idToUnparsedTweets.ts";
import { defaultFetch } from "../fetch/defaultFetch.ts";
import { tweetGroupToTweets } from "./urlToTweets.ts";

export async function urlToRecommendedTweets(
    url: string,
    fetchFn: FetchFn = defaultFetch
): Promise<Tweet[]> {
    const idFromInputURL = url.split("/")[5];
    const tweetGroups: any[] = await idToUnparsedTweets(idFromInputURL, "", true, fetchFn);
    let recommendedTweets: any[] = tweetGroups[tweetGroups.length - 2].content.items;
    return tweetGroupToTweets(recommendedTweets);
}
