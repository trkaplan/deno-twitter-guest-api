import { currentGuestToken, getNewGuestToken } from "../guestToken.ts";
import { AUTHORIZATION, apiBase } from "../constants.ts";

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