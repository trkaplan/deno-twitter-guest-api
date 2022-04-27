import { Tweet, TweetMedia, TweetURLs } from "../types.ts";
import { queryToUnparsedTweets } from "../fetch/queryToUnparsedTweets.ts";

export interface QueryTweet extends Tweet {
    date: Date;
    quotedTweetID?: string;
    retweetTweetId?: string;
    retweetedBy?: string[];
}

export async function queryToTweets(query: string): Promise<QueryTweet[]> {

    const [tweets, users]  = await queryToUnparsedTweets(query);
    let parsedTweets: QueryTweet[] = [];

    // data is separated into users and tweets, so to attach username to tweet, 
    // need to get user info first

    // -- users --
    const userIdToName: any = {};
    for (const key in users) {
        const item = users[key];
        //               id               name
        userIdToName[item.id_str] = item.screen_name;
    }

    // -- tweets --
    for (const key in tweets) {
        const item = tweets[key];
        const tweet: QueryTweet = {
            // using id_str because that's the one that matches the url id
            id: item.id_str, // tweet id
            user: userIdToName[item.user_id_str], // username
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
            tweet.quotedTweetID = hasQuote;
        }

        const hasThread = item.self_thread;
        if (hasThread) {
            tweet.isThread = true;
            tweet.threadID = hasThread.id_str;
        } else {
            tweet.isThread = false;
        }

        const retweetTweetId = item.retweeted_status_id_str
        if (retweetTweetId) {
            tweet.retweetTweetId = retweetTweetId;
        }
        
        parsedTweets.push(tweet);
    }

    /*
    retweets have an item for the tweet and an item for the retweet, though it 
    seems the main difference is that the retweet tweet.text starts with
    "RT @user: ", where user is the user of the tweet, not the retweeter. thus, 
    the retweet is essentially a duplicate, sowe can delete the retweet items

    though, it might be nice to know it is a retweet, so add a retweetedBy 
    property to the tweet
    the retweet has the property retweeted_status_id_str, which is the id of the
    retweeted tweet, and user_id_str, which is the id of the user that retweeted
    */
    const tweetsMinusRetweetDupes: QueryTweet[] = [];
    const trackRetweets: any = [];
    for (const tweet of parsedTweets) {
        const isRetweetItem = tweet.retweetTweetId;
        if (isRetweetItem) {
            // track the id and user of the retweet, so we can assign this info 
            // to the original tweet
            const id: string = isRetweetItem;
            const user: string = tweet.user;
            trackRetweets.push([id, user]);
            // don't add to new list of tweets
        } else {
            // if not a retweet, add to new list of tweets
            tweetsMinusRetweetDupes.push(tweet);
        }
        
    }
    parsedTweets = tweetsMinusRetweetDupes;
    // add user retweet info to original tweet
    for (const tweet of parsedTweets) {
        const matches = trackRetweets.filter((x: string[]) => x[0] === tweet.id);
        if (matches) {
            tweet.retweetedBy = matches.map((x: string[]) => x[1]);
        }
    }

    /*
    quote tweet items do not contain their quoted tweet, instead the quoted 
    tweet is its own item. thus, we must manually assign quoted tweets to their 
    quote tweet. 

    quoted tweets can be deleted, UNLESS that quoted tweet is from the same user
    as the feed, as in the quoted tweet item is both a quoted tweet and an 
    original tweet


    loop through until find tweet with quote. add the quote tweet to it, then
    add to parsedTweets.
    bad idea to remove from array mid-loop, so tracking quoted tweets for second
    for-loop that removes quoted tweets (again, only if quoted tweet not from 
    same user as the feed)
    */

    // attach quoted tweet to quote tweet, and track which tweets are quoted by 
    // tweet id
    const quotedIds: string[] = [];
    let tempTweets: QueryTweet[] = [];
    for (const tweet of parsedTweets) {
        const quotedTweetID = tweet.quotedTweetID;
        if (quotedTweetID) {
            const quotedTweet = parsedTweets.find(t => t.id === quotedTweetID);
            if (quotedTweet) {
                // add quote tweet to tweet that quotes it
                tweet.quote = quotedTweet;
                
                // track added tweets, UNLESS TWEET THAT IS QUOTED IS BY SAME 
                // USER OF FEED (e.g. from:elonmusk)
                // (see comment above initiation of trackTweetIDsOfAdded)

                // get array of users of the feed
                const queryUsers = query.match(/(?<=from:)(.+?)(?=[ \)$])/g);
                // add 
                if (queryUsers?.includes(quotedTweet.user)) {
                    quotedIds.push(quotedTweet.user);
                }
            }
        }
        tempTweets.push(tweet);
    }
    parsedTweets = tempTweets;

    // remove tweets that are quoted by other tweets
    tempTweets = [];
    for (const tweet of parsedTweets) {
        if (quotedIds.includes(tweet.id)) {
            // don't add nothing
        } else {
            tempTweets.push(tweet);
        }
    }
    parsedTweets = tempTweets;

    return parsedTweets;
}