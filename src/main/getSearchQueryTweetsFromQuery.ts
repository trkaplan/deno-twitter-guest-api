import { Tweet, TweetMedia, TweetURLs } from "../types.ts";
import { getUnparsedSearchQueryTweets } from "../fetch/getUnparsedSearchQueryTweets.ts";

export async function getSearchQueryTweetsFromQuery(query: string): Promise<Tweet[]> {

    const unparsedTweets = await getUnparsedSearchQueryTweets(query);
    const allParsedTweets: Tweet[] = [];

    // data is separated into users and tweets, so to attach username to tweet, 
    // need to get user info first

    // users
    const users = unparsedTweets.users;
    const userIdToUsername: any = {};
    for (const item of Object.keys(users)) {
        //             id                            username
        userIdToUsername[users[item].id_str] = users[item].screen_name;
    }
    // tweets
    const tweets = unparsedTweets.tweets;
    const tempAllParsedTweets = [];
    for (const item of Object.keys(tweets)) {
        const tweet: any = {
            id: tweets[item].id_str,
            user: userIdToUsername[tweets[item].user_id_str],
            text: tweets[item].full_text,
            date: tweets[item].created_at,
        }
        const media = tweets[item]?.entities?.media;
        if (media) {
            tweet.media = [];
            for (const img of media) {
                const item: TweetMedia = {
                    twitterLink: img.url,
                    url: img.media_url_https,
                    type: img.type, // photo or video
                }
                tweet.media.push(item);
            }
        }
        const urls = tweets[item]?.entities?.urls;
        if (urls?.length > 0) {
            tweet.urls = [];
            for (const url of urls) {
                const item: TweetURLs = {
                    twitterLink: url.url,
                    url: url.expanded_url,
                }
                tweet.urls.push(item);
            }
        }
        const hasQuote = tweets[item]?.quoted_status_id_str;
        if (hasQuote) {
            tweet.quote = hasQuote;
        }
        const hasThread = tweets[item].self_thread;
        if (hasThread) {
            tweet.isThread = true;
        } else {
            tweet.isThread = false;
        }
        
        tempAllParsedTweets.push(tweet);
    }
    // console.log(tempAllParsedTweets);

    // tweets contain quoted tweets, so need to remove from tweets and add to 
    // each individual tweet in tweets

    // loop through until find tweet with quote. add the quote tweet to it, then
    // add to allParsedTweets. bad idea to remove from array mid-loop, so 
    // tracking added for second for-loop that adds unadded tweets to 
    // allParsedTweets
    const trackTweetIDsOfAdded = [];
    for (const tweet of tempAllParsedTweets) {
        if (tweet.quote) {
            const quotedTweet = tempAllParsedTweets.find(t => t.id == tweet.quote);
            // console.log(quotedTweet);
            if (quotedTweet) {
                // add quote tweet to tweet that quotes it
                tweet.quote = quotedTweet;
                allParsedTweets.push(tweet);
                // track added tweets
                trackTweetIDsOfAdded.push(tweet.id, quotedTweet.id);
            }
        }
    }
    for (const tweet of tempAllParsedTweets) {
        if (!trackTweetIDsOfAdded.includes(tweet.id)) {
            allParsedTweets.push(tweet);
        }
    }

    return allParsedTweets;
}