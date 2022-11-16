// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const AUTHORIZATION = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
const apiBase = "https://twitter.com/i/api/";
async function defaultFetch(url, method, AUTHORIZATION, xGuestToken = "") {
    const headers = {
        "authorization": AUTHORIZATION
    };
    if (xGuestToken !== "") {
        headers["x-guest-token"] = xGuestToken;
    }
    return await fetch(url, {
        "method": method,
        "credentials": "omit",
        "headers": headers
    }).then((r)=>r.json()).catch((e)=>({}));
}
let currentGuestToken = "";
async function newGuestToken(fetchFn = defaultFetch) {
    const url = "https://api.twitter.com/1.1/guest/activate.json";
    const obj = await fetchFn(url, "POST", AUTHORIZATION, "").catch(()=>{
        console.log("Error fetching guest token");
        return {};
    });
    return obj?.guest_token;
}
async function idToUnparsedTweets(tweetID, cursor, includeRecommendedTweets = false, fetchFn = defaultFetch) {
    const variables = {
        "focalTweetId": tweetID,
        "with_rux_injections": includeRecommendedTweets,
        "includePromotedContent": false,
        "withCommunity": true,
        "withQuickPromoteEligibilityTweetFields": false,
        "withBirdwatchNotes": false,
        "withSuperFollowsUserFields": false,
        "withDownvotePerspective": false,
        "withReactionsMetadata": false,
        "withReactionsPerspective": false,
        "withSuperFollowsTweetFields": false,
        "withVoice": false,
        "withV2Timeline": true,
        "__fs_responsive_web_like_by_author_enabled": false,
        "__fs_dont_mention_me_view_api_enabled": false,
        "__fs_interactive_text_enabled": true,
        "__fs_responsive_web_uc_gql_enabled": false,
        "__fs_responsive_web_edit_tweet_api_enabled": false
    };
    if (cursor !== "") {
        variables["cursor"] = cursor;
    }
    let url = apiBase + "graphql/L1DeQfPt7n3LtTvrBqkJ2g/TweetDetail?variables=" + encodeURI(JSON.stringify(variables));
    let guestToken = currentGuestToken || await newGuestToken(fetchFn);
    let obj = await fetchFn(url, "GET", AUTHORIZATION, guestToken);
    if (obj?.errors) {
        guestToken = await newGuestToken(fetchFn);
        obj = await fetchFn(url, "GET", AUTHORIZATION, guestToken);
    }
    obj = obj?.data?.threaded_conversation_with_injections_v2?.instructions?.[0];
    let tweets = obj?.entries;
    if (tweets === undefined) {
        tweets = obj?.moduleItems;
    }
    return tweets;
}
function parseUrls(json) {
    let urlsJson = json["entities"]?.["urls"];
    if (urlsJson === undefined) {
        return null;
    }
    let urls = [];
    for (let urlJson of urlsJson){
        let item = {
            shortenedUrl: urlJson["url"],
            fullUrl: urlJson["expanded_url"]
        };
        urls.push(item);
    }
    return urls;
}
function parseMedia(json) {
    let mediaJson = json["extended_entities"]?.["media"];
    if (mediaJson !== undefined) {
        let media = [];
        for (let item of mediaJson){
            let shortenedImgUrl = item["url"];
            let fullImgUrl = item["media_url_https"];
            let kind = item["type"];
            let videoUrl = null;
            if (kind === "video") {
                let variants = item["video_info"]["variants"];
                let highestBitrate = 0;
                let highestBitrateMp4Url = "";
                for (let variant of variants){
                    let bitrate = variant["bitrate"] ?? 0;
                    if (bitrate > highestBitrate) {
                        highestBitrate = bitrate;
                        highestBitrateMp4Url = variant["url"];
                    }
                }
                videoUrl = highestBitrateMp4Url;
            } else if (kind === "animated_gif") {
                videoUrl = item["video_info"]["variants"][0]["url"];
            }
            let mediaItem = {
                shortenedImgUrl,
                fullImgUrl,
                kind,
                videoUrl
            };
            media.push(mediaItem);
        }
        return media;
    } else {
        return null;
    }
}
function sleep(ms) {
    return new Promise((resolve)=>setTimeout(resolve, ms));
}
async function urlToTweets(url, fetchFn = defaultFetch) {
    const tweetId = url.split("/")[5];
    let tweets = await urlToTweetsNoCursorPosition(tweetId, fetchFn);
    let lastTweet = tweets[tweets.length - 1];
    while(lastTweet.id === "more_tweets_in_thread"){
        let cursor = lastTweet.text;
        tweets.pop();
        sleep(100);
        let showMoreTweets = await urlToTweetsWithCursorPosition(tweetId, cursor, fetchFn);
        let existingTweetIds = tweets.map((t)=>t.id);
        for (let showMoreTweet of showMoreTweets){
            if (!existingTweetIds.includes(showMoreTweet.id)) {
                tweets.push(showMoreTweet);
            }
        }
        lastTweet = tweets[tweets.length - 1];
    }
    return tweets;
}
async function urlToTweetsWithCursorPosition(tweetId, cursor, fetchFn) {
    let tweetGroupsJson = await idToUnparsedTweets(tweetId, cursor, false, fetchFn);
    let tweetGroup = tweetGroupsJson;
    return tweetGroupToTweets(tweetGroup);
}
async function urlToTweetsNoCursorPosition(tweetId, fetchFn) {
    let tweetGroups = await idToUnparsedTweets(tweetId, "", false, fetchFn);
    let mainTweetIndex = getMainTweetIndex(tweetGroups, tweetId);
    let mainGroupTweets = tweetGroupToTweetOrTweets(tweetGroups[mainTweetIndex]);
    let nextGroupTweets = [];
    let nextGroup = tweetGroups[mainTweetIndex + 1];
    if (nextGroup !== undefined) {
        nextGroupTweets = tweetGroupToTweetOrTweets(nextGroup);
    }
    if (mainTweetIndex == 0) {
        if (nextGroupTweets.length > 0 && nextGroupTweets[0].user == mainGroupTweets[0].user) {
            mainGroupTweets.push(...nextGroupTweets);
        }
        return mainGroupTweets;
    }
    let prevGroupTweets = tweetGroupToTweetOrTweets(tweetGroups[mainTweetIndex - 1]);
    let prevTweetIsSameUser = prevGroupTweets[0].user === mainGroupTweets[0].user;
    if (prevTweetIsSameUser) {
        return mainGroupTweets;
    } else {
        if (nextGroupTweets.length > 0 && nextGroupTweets[0].user == mainGroupTweets[0].user) {
            mainGroupTweets.push(...nextGroupTweets);
        }
        return mainGroupTweets;
    }
}
function getMainTweetIndex(tweetGroups, tweetId) {
    for (let [i, tweetGroup] of tweetGroups.entries()){
        let entryId = tweetGroup["entryId"];
        let id = entryId.substring(6);
        if (id === tweetId) {
            return i;
        }
    }
    return 0;
}
function tweetGroupToTweetOrTweets(tweetGroup) {
    let contents = tweetGroup["content"]?.["items"];
    if (contents !== undefined) {
        return tweetGroupToTweets(contents);
    } else {
        let tweet = parseTweetContents(tweetGroup["content"]["itemContent"]);
        if (tweet !== null) {
            return [
                tweet
            ];
        } else {
            return [];
        }
    }
}
function tweetGroupToTweets(tweetGroup) {
    return tweetGroup.map((tweetItem)=>{
        let tweet = parseTweetContents(tweetItem["item"]["itemContent"]);
        if (tweet !== null) {
            return tweet;
        } else {
            throw "tweet missing";
        }
    });
}
function parseTweetContents(unparsedTweet) {
    unparsedTweet = unparsedTweet["tweet_results"]?.["result"] ?? unparsedTweet["result"];
    if (unparsedTweet !== undefined) {
        let kind = itemType(unparsedTweet);
        switch(kind){
            case "Tweet":
                break;
            case "TweetWithVisibilityResults":
                unparsedTweet = unparsedTweet["tweet"];
                break;
            case "TweetTombstone":
                return createMissingTweet(unparsedTweet);
            default:
                throw `idk what type this is: ${kind}`;
        }
    } else {
        let kind1 = itemType(unparsedTweet);
        if (kind1 === "TimelineTimelineCursor") {
            let showMoreCursor = unparsedTweet["value"];
            return {
                id: "more_tweets_in_thread",
                user: "",
                text: showMoreCursor
            };
        } else {
            return null;
        }
    }
    let id = unparsedTweet["legacy"]["id_str"];
    let user = unparsedTweet["core"]["user_results"]["result"]["legacy"]["screen_name"];
    let text = unparsedTweet["legacy"]["full_text"];
    let media = parseMedia(unparsedTweet["legacy"]);
    let urls = parseUrls(unparsedTweet["legacy"]);
    let quote = null;
    let quoteContents = unparsedTweet["quoted_status_result"];
    if (quoteContents !== undefined) {
        let tweet = parseTweetContents(quoteContents);
        if (tweet !== null) {
            quote = tweet;
        }
    }
    return {
        id,
        user,
        text,
        media,
        urls,
        quote
    };
}
function itemType(item) {
    let type = item["entryType"] ?? item["itemType"] ?? item["__typename"];
    if (type === undefined) {
        throw `can't find type:\n${item}`;
    }
    return type;
}
function createMissingTweet(unparsedTweet) {
    let txt = unparsedTweet["tombstone"]["text"]["text"];
    return {
        id: "",
        user: "unknown",
        text: `<<< ${txt.slice(0, txt.length - 11)} >>>`
    };
}
async function queryToUnparsedTweets(query, fetchFn = defaultFetch) {
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
    };
    const paramsString = new URLSearchParams(params).toString();
    const url = apiBase + "2/search/adaptive.json?" + paramsString;
    let guestToken = currentGuestToken || await newGuestToken(fetchFn);
    let obj = await fetchFn(url, "GET", AUTHORIZATION, guestToken);
    if (obj?.errors || JSON.stringify(obj) === "{}") {
        guestToken = await newGuestToken(fetchFn);
        obj = await fetchFn(url, "GET", AUTHORIZATION, guestToken);
    }
    return obj;
}
async function queryToTweets(query, fetchFn = defaultFetch) {
    let parsedTweetsMap = new Map();
    let fetchJson = await queryToUnparsedTweets(query, fetchFn);
    let usersJson = fetchJson["globalObjects"]?.["users"];
    if (usersJson === undefined) return [];
    let userIdToNameMap = new Map();
    for (let userJson of Object.values(usersJson)){
        let id = userJson["id_str"];
        let name = userJson["screen_name"];
        userIdToNameMap.set(id, name);
    }
    let tweetsJson = fetchJson["globalObjects"]["tweets"];
    if (tweetsJson === undefined) {
        throw "this will never trigger";
    }
    for (let tweetJson of Object.values(tweetsJson)){
        let parsedTweet = {
            id: tweetJson["id_str"] ?? "",
            user: userIdToNameMap.get(tweetJson["user_id_str"] ?? "") ?? "",
            text: tweetJson["full_text"] ?? ""
        };
        parsedTweet.media = parseMedia(tweetJson);
        parsedTweet.urls = parseUrls(tweetJson);
        parsedTweet.threadId = tweetJson["self_thread"]?.["id_str"] ?? null;
        parsedTweet.extra = {
            date: tweetJson["created_at"] ?? "",
            retweetedBy: null,
            faves: tweetJson["favorite_count"] ?? 0
        };
        let quotedTweetId = tweetJson["quoted_status_id_str"] ?? null;
        let retweetedTweetId = tweetJson["retweeted_status_id_str"] ?? null;
        parsedTweetsMap.set(parsedTweet.id, [
            parsedTweet,
            quotedTweetId,
            retweetedTweetId
        ]);
    }
    let timelineTweetIds = fetchJson["timeline"]["instructions"][0]["addEntries"]["entries"].reduce((accum, item)=>{
        let id = item["entryId"] ?? "";
        if (id.length == 26) {
            return [
                ...accum,
                id.substring(7)
            ];
        } else {
            return accum;
        }
    }, []);
    let parsedTweets = timelineTweetIds.map((id)=>{
        let item = parsedTweetsMap.get(id);
        if (item === undefined) {
            throw "this will never trigger";
        }
        let [tweetItem, quotedTweetId, retweetedTweetId] = item;
        if (retweetedTweetId !== null) {
            let retweetedBy = tweetItem.user;
            let item1 = parsedTweetsMap.get(retweetedTweetId);
            if (item1 === undefined) {
                throw "this will never trigger";
            }
            [tweetItem, quotedTweetId] = item1;
            if (tweetItem.extra !== null && tweetItem.extra !== undefined) {
                tweetItem.extra.retweetedBy = [
                    retweetedBy
                ];
            }
        }
        if (quotedTweetId !== null) {
            let item2 = parsedTweetsMap.get(quotedTweetId);
            if (item2 === undefined) {
                throw "this will never trigger";
            }
            let [qTweetItem] = item2;
            tweetItem.quote = qTweetItem;
        }
        return tweetItem;
    });
    return parsedTweets;
}
async function urlToRecommendedTweets(url, fetchFn = defaultFetch) {
    const idFromInputURL = url.split("/")[5];
    const tweetGroups = await idToUnparsedTweets(idFromInputURL, "", true, fetchFn);
    let recommendedTweets = tweetGroups[tweetGroups.length - 2].content.items;
    return tweetGroupToTweets(recommendedTweets);
}
export { urlToTweets as urlToTweets };
export { queryToTweets as queryToTweets };
export { urlToRecommendedTweets as urlToRecommendedTweets };
export { idToUnparsedTweets as idToUnparsedTweets };
export { queryToUnparsedTweets as queryToUnparsedTweets };
