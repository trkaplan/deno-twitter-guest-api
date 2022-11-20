import { currentGuestToken, newGuestToken } from "./guestToken.ts";
import { AUTHORIZATION, apiBase } from "../constants.ts";
import { defaultFetch } from "./defaultFetch.ts";
import { FetchFn } from "../types.ts";

/**
 * get unparsed twitter feed object from twitter search query
 * @param query 
 * @returns object with users and tweets
 */
export async function queryToUnparsedTweets(
    query: string,
    fetchFn: FetchFn = defaultFetch
    ): Promise<any> {

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
        q: query,                             // <-- 🚨🚨🚨
        tweet_search_mode: "live",
        count: "20",
        query_source: "typed_query",
        pc: "1",
        spelling_corrections: "1",
        ext: "mediaStats,highlightedLabel,hasNftAvatar,voiceInfo,enrichments,superFollowMetadata,unmentionInfo"
    }
    const paramsString = new URLSearchParams(params).toString();
    const url = apiBase + "2/search/adaptive.json?" + paramsString;

    let guestToken = currentGuestToken || await newGuestToken(fetchFn);
    let obj = await fetchFn(url, "GET", AUTHORIZATION, guestToken);
    if (obj?.errors) {
        // if guest token is invalid or expired, get a new one and try again
        if (obj.errors.code === 215 || obj.errors.code === 200) {
            guestToken = await newGuestToken(fetchFn);
            obj = await fetchFn(url, "GET", AUTHORIZATION, guestToken);
        } else {
            console.log(`twitter get request error code: ${obj.errors.code}`)
        }
    }
    return obj;
}
