import { Tweet } from "../types.ts";
import { idToUnparsedTweets } from "../fetch/idToUnparsedTweets.ts";
import { parseTweetContents } from "../parseTweetContents.ts";

/**
get a tweet/tweet-thread in a parsed format (most of the junk removed), as a
list of tweets, starting with the first tweet

if more information is required than in @interface Tweet, use getUnparsedTweets() instead
*/
export async function urlToTweets(url: string): Promise<Tweet[]> {

    const idFromInputURL = url.split("/")[5];
    const tweetGroups = await idToUnparsedTweets(idFromInputURL);
    const allParsedTweets: Tweet[] = [];

    // find out which tweet group contains the main tweet
    const mainTweetIndex: number = getMainTweetIndex(tweetGroups, idFromInputURL);

    // get main tweet
    const mainTweet: Tweet[] = tweetGroupToTweets(tweetGroups[mainTweetIndex]);
    
    /* ---- Examples of tweet patterns we need to match ----

    1: (user1) -> user2 -> user3 -> user4   (single tweet)

    2: user1 -> (user2) -> user3 -> user4   (single reply)

    3: (user1) -> user1 -> user1 -> user3   (start tweet thread)
    4: user1 -> (user1) -> user1 -> user3   (mid tweet thread)
    5: user1 -> user1 -> (user1) -> user3   (end tweet thread)

    6: user1 -> (user2) -> user2 -> user2   (start reply thread)
    7: user1 -> user2 -> (user2) -> user2   (mid reply thread)
    8: user1 -> user2 -> user2 -> (user2)   (end reply thread)

    TWO MAIN TYPES OF TWEETS WE NEED TO PARSE:
    1: tweet group at position 0 OR with diff user in prev tweet group
          - if next tweet group is diff user, just add main tweet group to 
            allParsedTweets
          - if next tweet group is same user, add main tweet group, AND next tweet
            group (thread) to allParsedTweets
    2: tweet group with same user prev to main tweet group. this is either mid 
       or end of thread/reply-thread
          - for this, just add main tweet group to allParsedTweets
    */

    // if there is a next tweet group, get it
    let nextTweetGroup: Tweet[] = [];
   
    const nextGroup = tweetGroups[mainTweetIndex + 1]
    console.log(nextGroup);
    //                                   this handles show more button
    const isNotShowMore = nextGroup?.content?.itemContent?.cursorType !== "ShowMoreThreadsPrompt";
    const nextGroupExists = nextGroup && isNotShowMore;
    if (nextGroupExists) {
        nextTweetGroup = tweetGroupToTweets(nextGroup);
    }
    console.log("HERE");

    // if main tweet is first tweet, add first tweetGroup (main tweet), and 
    // second tweetGroup (the thread) if it is same user, to allParsedTweets
    if (mainTweetIndex == 0) {
        allParsedTweets.push(...mainTweet);
        if (nextTweetGroup) {
            const thread: Tweet[] = nextTweetGroup;
            // this is also false if thread doesn't exist
            if (thread?.[0]?.user === mainTweet[0].user) {
                allParsedTweets.push(...thread);
            }
        }
        return allParsedTweets;
    }

    // get prev tweet group and next tweet group
    const prevTweetGroup: Tweet[] = tweetGroupToTweets(tweetGroups[mainTweetIndex - 1]);
    const prevTweetIsSameUser: boolean = prevTweetGroup[0].user === mainTweet[0].user;

    // if prev tweet group is diff user, its first tweet of a reply
    if (! prevTweetIsSameUser) {
        const i = mainTweetIndex;
        allParsedTweets.push(...mainTweet);
        if (nextTweetGroup) {
            const thread: Tweet[] = nextTweetGroup;
            // this is also false if thread doesn't exist
            if (thread?.[0]?.user === mainTweet[0].user) {
                allParsedTweets.push(...thread);
            }
        }
        return allParsedTweets;
    }

    // if prev tweet group is same user, it is mid/end of tweet thread, so just 
    // return main tweet group
    if (prevTweetIsSameUser) {
        allParsedTweets.push(...mainTweet);
    }

    return allParsedTweets;
}

function getMainTweetIndex(tweetGroups: any, idFromInputURL: string): number {
    for (let i=0; i < tweetGroups.length; i++) {
        const entryId = tweetGroups[i].entryId;
        // "tweet-1516856286738598375" -> "1516856286738598375"
        const id = entryId?.substring(6);
        if (id === idFromInputURL) {
            return i;
        }
    }
    // will never reach this return, but typescript complains if it isn't there
    return 0;
}

function tweetItemGroupToTweet(tweetContents: any): Tweet | null {
    const parsedTweet: Tweet | null = parseTweetContents(tweetContents);
    return parsedTweet;
}
function tweetModuleGroupToTweets(tweetContents: any): Tweet[] | null {
    let tweets: Tweet[] | null = [];
    for (const tweetItem of tweetContents) {
        const tweetContents = tweetItem.item;
        console.log("tweetContents");
        console.log(tweetContents);

        // if its a "show more" item, dont add
        if (tweetContents?.itemContent?.displayTreatment?.actionText === "Show replies") {
            break;
        }

        const parsedTweet: Tweet | null = parseTweetContents(tweetContents);

        // if the tweet is null, it's a "show more" tweet, so end of thread
        if (parsedTweet === null) {
            break;
        }
        tweets.push(parsedTweet);
    }
    return tweets;
}

function tweetGroupToTweets(tweetGroup: any): Tweet[] {
    const returnTweets: Tweet[] = [];
    const contents = tweetGroup.content?.items;
    if (contents) {
        const tweets = tweetModuleGroupToTweets(contents);
        if (tweets) {
            returnTweets.push(...tweets);
        }
    } else {
        const tweet = tweetItemGroupToTweet(tweetGroup.content)
        if (tweet) {
            returnTweets.push(tweet);
        }
    }
    return returnTweets;
}
