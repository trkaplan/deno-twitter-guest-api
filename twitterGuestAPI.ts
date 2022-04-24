/*
web inspector
 -> Fetch/XHR
 -> Look for one starting with "TweetDetail?variables="

for guest token API call you need to open a private window and open 
webinspector before you go to twitter.com
*/



/* -- TO DO: --

- if thread contains show more button, need to get the next page of tweets

*/



const AUTHORIZATION = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA"
const apiBase = "https://twitter.com/i/api/";
let currentGuestToken: string = await getNewGuestToken();


/**
 * get "x-guest-token" for subsequent requests
 * @returns guest token
 */
async function getNewGuestToken(): Promise<string> {

    const obj = await fetch("https://api.twitter.com/1.1/guest/activate.json", {
        "method": "POST",
        "credentials": "omit",
        "headers": {
            "authorization": AUTHORIZATION,
        },
    }).then(r => r.json())
        .catch(() => "");
    
    return obj?.guest_token;
}

/**
 * call twitter API to get all tweets on a the page with tweet id tweetID
 * @param tweetID id of tweet page to get
 * @param includeRecommendedTweets whether to include the recommended tweets 
 * section on the page
 */
export async function getUnparsedTweets(
    tweetID: string,
    includeRecommendedTweets: boolean = false
    ): Promise<Array<any>> {
    
    const variables = {
        "focalTweetId":tweetID,
        "with_rux_injections":includeRecommendedTweets, // true = include recommended tweets
        "includePromotedContent":false, // true = include promoted tweets (ads)
        "withCommunity":true, // 🚨🚨🚨🚨🚨 idk???? could be related to promoted content or rux injections
        "withQuickPromoteEligibilityTweetFields":false, // 🚨🚨🚨🚨🚨 idk???? could be related to promoted content or rux injections
        "withBirdwatchNotes":false, // true = add "has_birdwatch_notes" key (val is bool) to tweet_results.result
        "withSuperFollowsUserFields":false, // true = add "super_follow_eligible", "super_followed_by", and "super_following" keys (vals are bool) to user_results.result
        "withDownvotePerspective":false, // 🚨🚨🚨🚨🚨 ACCESS DENIED for true RN, but prob num of downvotes
        "withReactionsMetadata":false, // 🚨🚨🚨🚨🚨 ACCESS DENIED for true RN
        "withReactionsPerspective":false, // 🚨🚨🚨🚨🚨 ACCESS DENIED for true RN
        "withSuperFollowsTweetFields":false, // 🚨🚨🚨🚨🚨 idk????
        "withVoice":false, // 🚨🚨🚨🚨🚨 idk????
        "withV2Timeline":true, // slight change to a small part of the json, but irrelevant for the most part
        "__fs_responsive_web_like_by_author_enabled":false, // true added an ad.. idk why
        "__fs_dont_mention_me_view_api_enabled":false, // true = add "unmention_info" key (val is obj, but seems to always be empty, at least on guest token) to tweet_results.result
        "__fs_interactive_text_enabled":true, // 🚨🚨🚨🚨🚨 idk????
        "__fs_responsive_web_uc_gql_enabled":false, // 🚨🚨🚨🚨🚨 idk????
        "__fs_responsive_web_edit_tweet_api_enabled":false, // 🚨🚨🚨🚨🚨 idk????
    }
    let url = apiBase + "graphql/L1DeQfPt7n3LtTvrBqkJ2g/TweetDetail?variables="
                + encodeURI(JSON.stringify(variables));

    let guestToken = currentGuestToken;
    let obj: any;
    for (const i of [1, 2]) {
        obj = await fetch(url, {
            "credentials": "omit",
            "headers": {
                "authorization": AUTHORIZATION,
                "x-guest-token": guestToken,
            },
        }).then(r => r.json());
        // if guest token is expired, get a new one and try again
        if (obj.errors) {
            guestToken = await getNewGuestToken();
        } else {
            // if guest token is valid, break
            break;
        }
    }

    const tweets = obj.data.threaded_conversation_with_injections_v2
                    .instructions[0].entries
    // console.log(tweets);
    return tweets;
}

function parseTweetContents(tweetContents: any): Tweet | Quote {
    const mainTweet: Tweet | Quote = {
        id: tweetContents.legacy.id_str,
        user: tweetContents.core.user_results.result.legacy.screen_name,
        text: tweetContents.legacy.full_text,
    }
    const media = tweetContents.legacy.entities?.media;
    if (media) {
        mainTweet.media = []
        for (const img of media) {
            const item: TweetMedia = {
                twitterLink: img.url,
                url: img.media_url_https,
                type: img.type, // photo or video
            }
            mainTweet.media.push(item);
        }
    }
    const urls = tweetContents.legacy.entities.urls;
    if (urls?.length > 0) {
        mainTweet.urls = [];
        for (const url of urls) {
            const item: TweetUrls = {
                twitterLink: url.url,
                url: url.expanded_url,
            }
            mainTweet.urls.push(item);
        }
    }
    const isQuote = tweetContents?.quoted_status_result
    if (isQuote) {
        const quoteContents = tweetContents.quoted_status_result.result
        mainTweet.quote = parseTweetContents(quoteContents)
        mainTweet.quote.url = tweetContents.legacy.quoted_status_permalink
        delete mainTweet.quote.url.display
    }
    return mainTweet;
}

/**
 * @param id id number of tweet (last part of url)
 * @param user username of the account who posted the tweet
 * @param text the text of the tweet
 */
interface Tweet {
    id: string;
    user: string;
    text: string;
    media?: TweetMedia[];
    urls?: TweetUrls[];
    quote?: Quote;
    isThread?: boolean;
}
/**
 * @param twitterLink the twitter shortened url
 * @param url the original image url
 * @param type photo or video
 */
interface TweetMedia {
    twitterLink: string;
    url: string;
    type: string;
}
/**
 * @param twitterLink the twitter shortened url
 * @param url the original url
 */
interface TweetUrls {
    twitterLink: string;
    url: string;
}
/**
 * @param url the url of the quoted tweet
 */
interface Quote extends Tweet {
    url?: any;
}

/**
get a tweet/tweet-thread in a parsed format (most of the junk removed), as a
list of tweets, starting with the first tweet

if more information is required than in @Tweet, use getUnparsedTweets() instead
*/
export async function tweetsFromURL(url: string): Promise<Tweet[]> {

    const idFromInputUrl = url.split("/")[5];
    const tweetGroups = await getUnparsedTweets(idFromInputUrl);
    const allParsedTweets: Tweet[] = [];

    // -- find main tweet --
    // need to do this bc even though usually the top furst tweet is the main 
    // tweet, if the tweet is halfway down a thread it wont be the first tweet
    let i: number;
    for (i=0; i < tweetGroups.length; i++) {
        const entryId = tweetGroups[i].entryId;
        // "tweet-1516856286738598375" -> "1516856286738598375"
        const id = entryId?.substring(6);
        if (id === idFromInputUrl) {
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

    // 🚨🚨🚨🚨 ONLY GET THREAD IF ITS THE FIRST TWEET, OR IF THE TWEET RIGHT 
    // ABOVE IT IS A DIFFERENT USER
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

export async function getRecommendedTweetsFromUrl(url: string): Promise<Tweet[]> {

    const idFromInputUrl = url.split("/")[5];
    const tweetGroups = await getUnparsedTweets(idFromInputUrl, true);
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



async function getUnparsedSearchQueryTweets(query: string): Promise<any> {

    const params = {
        include_profile_interstitial_type: "1",
        include_blocking: "1",
        include_blocked_by: "1",
        include_followed_by: "1",
        include_want_retweets: "1",
        include_mute_edge: "1",
        include_can_dm: "1",
        include_can_media_tag: "1",
        include_ext_has_nft_avatar: "1",
        skip_status: "1",
        cards_platform: "Web-12",
        include_cards: "1",
        include_ext_alt_text: "true",
        include_quote_count: "true",
        include_reply_count: "1",
        tweet_mode: "extended",
        include_entities: "true",
        include_user_entities: "true",
        include_ext_media_color: "true",
        include_ext_media_availability: "true",
        include_ext_sensitive_media_warning: "true",
        include_ext_trusted_friends_metadata: "true",
        send_error_codes: "true",
        simple_quoted_tweet: "true",
        q: query,
        tweet_search_mode: "live",
        count: "20",
        query_source: "typed_query",
        pc: "1",
        spelling_corrections: "1",
        ext: "mediaStats,highlightedLabel,hasNftAvatar,voiceInfo,enrichments,superFollowMetadata,unmentionInfo"
    }
    const paramsString = new URLSearchParams(params).toString();
    const url = apiBase + "2/search/adaptive.json?" + paramsString;

    let guestToken = currentGuestToken;
    let obj: any;
    for (const i of [1, 2]) {
        obj = await fetch(url, {
            "credentials": "omit",
            "headers": {
                "authorization": AUTHORIZATION,
                "x-guest-token": guestToken,
            },
        }).then(r => r.json());
        // if guest token is expired, get a new one and try again
        if (obj.errors) {
            guestToken = await getNewGuestToken();
        } else {
            // if guest token is valid, break
            break;
        }
    }

    const tweets = obj.globalObjects;
    return tweets;
}

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
                const item: TweetUrls = {
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

const var1 = await getSearchQueryTweetsFromQuery("from:zhusu -filter:replies min_faves:700");
// console.log(var1)

