import { Tweet, FetchFn, Option } from "../types.ts";
import { queryToUnparsedTweets } from "../fetch/queryToUnparsedTweets.ts";
import { defaultFetch } from "../fetch/defaultFetch.ts";
import { parseMedia, parseUrls } from "./parsing.ts";

export async function queryToTweets(
  query: string,
  fetchFn: FetchFn = defaultFetch
  ): Promise<Tweet[]> {

  let parsedTweetsMap: Map<string, [Tweet, Option<string>, Option<string>]> = new Map();
  let fetchJson = await queryToUnparsedTweets(query, fetchFn);
  let usersJson: any[] = fetchJson["globalObjects"]?.["users"];
  if (usersJson === undefined) return [];
  let userIdToNameMap: Map<string, string> = new Map();
  for (let userJson of Object.values(usersJson)) {
    let id: string = userJson["id_str"];
    let name: string = userJson["screen_name"];
    userIdToNameMap.set(id, name);
  }
  let tweetsJson: any[] = fetchJson["globalObjects"]["tweets"];
  if (tweetsJson === undefined) { throw "this will never trigger" }
  for (let tweetJson of Object.values(tweetsJson)) {
    let parsedTweet: Tweet = {
      id: tweetJson["id_str"] ?? "",
      user: userIdToNameMap.get(tweetJson["user_id_str"] ?? "") ?? "",
      text: tweetJson["full_text"] ?? "",
    };
    parsedTweet.media = parseMedia(tweetJson);
    parsedTweet.urls = parseUrls(tweetJson);
    parsedTweet.threadId = tweetJson["self_thread"]?.["id_str"] ?? null;
    parsedTweet.extra = {
      date: tweetJson["created_at"] ?? "",
      retweetedBy: null,
      faves: tweetJson["favorite_count"] ?? 0,
    };
    let quotedTweetId: Option<string> = tweetJson["quoted_status_id_str"] ?? null;
    let retweetedTweetId: Option<string> = tweetJson["retweeted_status_id_str"] ?? null;
    parsedTweetsMap.set(parsedTweet.id, [parsedTweet, quotedTweetId, retweetedTweetId]);
  }
  let timelineTweetIds: string[] = fetchJson["timeline"]["instructions"][0]
    ["addEntries"]["entries"]
    .reduce((accum: string[], item: any) => {
      let id: string = item["entryId"] ?? "";
      if (id.length == 26) {
        return [...accum, id.substring(7)]
      } else {
        return accum
      }
    }, [])
  let parsedTweets: Tweet[] = timelineTweetIds
    .map((id: string) => {
      let item = parsedTweetsMap.get(id);
      if (item === undefined) { throw "this will never trigger" }
      let [ tweetItem, quotedTweetId, retweetedTweetId ] =  item;
      if (retweetedTweetId !== null) {
        let retweetedBy = tweetItem.user;
        let item = parsedTweetsMap.get(retweetedTweetId);
        if (item === undefined) { throw "this will never trigger" }
        [tweetItem, quotedTweetId,] = item;
        if (tweetItem.extra !== null && tweetItem.extra !== undefined) {
          tweetItem.extra.retweetedBy = [retweetedBy];
        }
      }
      if (quotedTweetId !== null) {
        let item = parsedTweetsMap.get(quotedTweetId);
        if (item === undefined) { throw "this will never trigger" }
        let [qTweetItem, , ] = item;
          tweetItem.quote = qTweetItem;
      }
      return tweetItem
    });
  return parsedTweets
}

// TODO: implement this v1 twitter api

// const token = "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
// const fetchTweetsFromUser = async (screenName, count) => {
//   const response = await fetch(
//     `https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=${screenName}&count=${count}`,
//     {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     }
//   );
//   const json = await response.json();
//   return json;
// }
// await fetchTweetsFromUser("elonmusk", 10).then(console.log);
