/*

bundle code for non-deno:
deno bundle ./mod.ts twitterGuestAPI.bundle.js

*/

/*
--- info about how to find the APIs in twitter --

for getNewGuestToken():
  open a private window and open webinspector before you go to twitter.com/search
   -> go to twitter.com
   -> in webinspector
     -> Network tab
     -> Fetch/XHR
     -> Look for one named "activate.json"

for getUnparsedTweets():
  web inspector
   -> Network tab
   -> Fetch/XHR
   -> Look for one starting with "TweetDetail?variables="

for getUnparsedSearchQueryTweets():
  web inspector
   -> Network tab
   -> Fetch/XHR
   -> Look for one starting with "adaptive.json?"
*/



/* -- TO DO: --

- if thread contains show more button, need to get the next page of tweets

*/



export { getTweetsFromURL } from "./src/main/getTweetsFromURL.ts";
export { getSearchQueryTweetsFromQuery } from "./src/main/getSearchQueryTweetsFromQuery.ts";
export { getRecommendedTweetsFromURL } from "./src/main/getRecommendedTweetsFromURL.ts";

export { getUnparsedTweets } from "./src/fetch/getUnparsedTweets.ts";
export { getUnparsedSearchQueryTweets } from "./src/fetch/getUnparsedSearchQueryTweets.ts";
