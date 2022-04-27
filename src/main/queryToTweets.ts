import { Tweet, TweetMedia, TweetURLs } from "../types.ts";
import { queryToUnparsedTweets } from "../fetch/queryToUnparsedTweets.ts";

export async function queryToTweets(query: string): Promise<Tweet[]> {

    const [tweets, users]  = await queryToUnparsedTweets(query);
    const allParsedTweets: Tweet[] = [];

    // data is separated into users and tweets, so to attach username to tweet, 
    // need to get user info first

    // users
    const userIdToUsername: any = {};
    for (const key in users) {
        const item = users[key];
        //            id                   username
        userIdToUsername[item.id_str] = item.screen_name;
    }
    // tweets
    const tempAllParsedTweets = [];
    for (const key in tweets) {
        const item = tweets[key];
        const tweet: any = {
            // using id_str because that's the one that matches the url id
            id: item.id_str,
            user: userIdToUsername[item.user_id_str],
            text: item.full_text,
            date: item.created_at,
        }

        const media = item?.entities?.media;
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
        const urls = item?.entities?.urls;
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
        const hasQuote = item?.quoted_status_id_str;
        if (hasQuote) {
            tweet.quote = hasQuote;
        }

        const hasThread = item.self_thread;
        if (hasThread) {
            tweet.isThread = true;
            tweet.threadID = hasThread.id_str;
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

    // this fucks up if you quote your own tweet, because then it deletes the 
    // original tweet, so need to check if quote is of own tweet too
    const trackTweetIDsOfAdded = [];
    for (const tweet of tempAllParsedTweets) {
        if (tweet.quote) {
            const quotedTweetID = tweet.quote;
            const quotedTweet = tempAllParsedTweets.find(t => t.id == quotedTweetID);
            if (quotedTweet) {
                // add quote tweet to tweet that quotes it
                tweet.quote = quotedTweet;
                allParsedTweets.push(tweet);
                // track added tweets, UNLESS TWEET THAT IS QUOTED IS BY SAME 
                // USER OF FEED (e.g. from:elonmusk)
                // (see comment above initiation of trackTweetIDsOfAdded)
                const queryUsers = query.match(/(?<=from:)(.+?)(?=[ \)$])/g);
                if (queryUsers?.includes(quotedTweet.user)) {
                    trackTweetIDsOfAdded.push(tweet.id);
                } else {
                    trackTweetIDsOfAdded.push(tweet.id, quotedTweet.id);
                }
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