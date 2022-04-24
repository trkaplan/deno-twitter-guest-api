import { Tweet } from "../types.ts";
import { getUnparsedTweets } from "../fetch/getUnparsedTweets.ts";
import { parseTweetContents } from "../parseTweetContents.ts";

/**
get a tweet/tweet-thread in a parsed format (most of the junk removed), as a
list of tweets, starting with the first tweet

if more information is required than in @Tweet, use getUnparsedTweets() instead
*/
export async function getTweetsFromURL(url: string): Promise<Tweet[]> {

    const idFromInputURL = url.split("/")[5];
    const tweetGroups = await getUnparsedTweets(idFromInputURL);
    const allParsedTweets: Tweet[] = [];

    // -- find main tweet --
    // need to do this bc even though usually the top furst tweet is the main 
    // tweet, if the tweet is halfway down a thread it wont be the first tweet
    let i: number;
    for (i=0; i < tweetGroups.length; i++) {
        const entryId = tweetGroups[i].entryId;
        // "tweet-1516856286738598375" -> "1516856286738598375"
        const id = entryId?.substring(6);
        if (id === idFromInputURL) {
            break;
        }
    }
    // -- get main tweet --
    let mainTweetUser: string;
    {
        const tweet = tweetGroups[i];
        const tweetContents = tweet.content.itemContent.tweet_results.result
        const parsedTweet: Tweet = parseTweetContents(tweetContents)
        allParsedTweets.push(parsedTweet);
        mainTweetUser = parsedTweet.user;
    }

    // ONLY GET THREAD IF ITS THE FIRST TWEET, OR IF THE TWEET RIGHT ABOVE IT 
    // IS A DIFFERENT USER
    // in other words, if the main tweet is in the middle of a thread, don't get
    // the thread
    const mainIsFirstTweet = i === 0;
    let prevTweetNotSameUser: boolean = true; // changes to false if the previous tweet is from the same user
    if (! mainIsFirstTweet) {
        const prevTweet = tweetGroups[i-1];
        const prevTweetContents = prevTweet.content.itemContent.tweet_results.result
        const parsedPrevTweet: Tweet = parseTweetContents(prevTweetContents)
        const prevTweetUser = parsedPrevTweet.user;
        prevTweetNotSameUser = prevTweetUser !== mainTweetUser;
    }
    if (mainIsFirstTweet || prevTweetNotSameUser) {
        const tweetThread = tweetGroups[i + 1];
        const tweetThreadItems = tweetThread.content.items;
        for (const tweetItem of tweetThreadItems) {
            const tweetContents = tweetItem.item.itemContent.tweet_results?.result;
            // if the tweetItem is a "Show more" button, it has no .result, so 
            // above will return null. if null, it's not a tweet, so break
            if (tweetContents === undefined) {
                break;
            }
            const parsedTweet: Tweet = parseTweetContents(tweetContents);
            // check if tweet is in thread, if not then it is a reply so exit
            if (parsedTweet.user !== allParsedTweets[0].user) {
                break;
            }
            allParsedTweets.push(parsedTweet);
        }
    }
    return allParsedTweets;
}