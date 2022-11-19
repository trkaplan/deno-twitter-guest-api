import { currentGuestToken, newGuestToken } from "./guestToken.ts";
import { AUTHORIZATION, apiBase } from "../constants.ts";
import { defaultFetch } from "./defaultFetch.ts";
import { FetchFn } from "../types.ts";

/**
 * call twitter API to get all tweets on a the page with tweet id tweetID
 * @param tweetID id of tweet page to get
 * @param includeRecommendedTweets whether to include the recommended tweets 
 * section on the page
 */
export async function idToUnparsedTweets(
    tweetID: string,
    cursor: string,
    includeRecommendedTweets: boolean = false,
    fetchFn: FetchFn = defaultFetch
    ): Promise<Array<any>> {
    
    const variables: any = {
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
    if (cursor !== "") {
        variables["cursor"] =  cursor;
    }
    let url = apiBase + "graphql/L1DeQfPt7n3LtTvrBqkJ2g/TweetDetail?variables="
                + encodeURI(JSON.stringify(variables));

    let guestToken = currentGuestToken || await newGuestToken(fetchFn);
    let obj = await fetchFn(url, "GET", AUTHORIZATION, guestToken);
    if (obj?.errors) {
        // if guest token is expired, get a new one and try again
        if (obj.errors.code === 215) {
            guestToken = await newGuestToken(fetchFn);
            obj = await fetchFn(url, "GET", AUTHORIZATION, guestToken);
        } else {
            console.log(`twitter get request error code: ${obj.errors.code}`)
        }

    }
    obj = obj?.data?.threaded_conversation_with_injections_v2
        ?.instructions?.[0];
    let tweets = obj?.entries;
    if (tweets === undefined) {
        tweets = obj?.moduleItems;
    }
    return tweets;
}