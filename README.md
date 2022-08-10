# deno twitter guest api

basic twitter api for [deno](https://deno.land) that doesn't require you to have a twitter account to use

## use

```js
import {
    getSearchQueryTweetsFromQuery,
    getTweetsFromURL,
    getRecommendedTweetsFromURL
} from "https://deno.land/x/deno_twitter_guest_api@v0.2.0/mod.ts";
```

```js
// get most recent tweets based on twitter search query
const tweets = await getSearchQueryTweetsFromQuery("from:zhusu -filter:replies min_faves:700");
```

```js
// get tweet/tweet-thread based on tweet url
const tweets = await getTweetsFromURL("https://twitter.com/zhusu/status/1516675652438851589");
```

```js
// get recommended tweets based on tweet url
const tweets = await getRecommendedTweetsFromURL("https://twitter.com/zhusu/status/1516675652438851589");
```

## use outside of deno (node/tauri/electron/browser)

since this library is in deno-flavored typescript, you must transpile the library to a javascript bundle (or you could just copy the one i made (in this repo; `twitterGuestAPI.bundle.js`)):
```shell
git clone https://github.com/nogira/deno-twitter-guest-api.git
cd deno-twitter-guest-api
# use file `mod.ts` as entry point to transpile library to the new file `twitterGuestAPI.bundle.js`
deno bundle ./mod.ts twitterGuestAPI.bundle.js
```

### fetch compatibility

if the default fetch function is not compatible (e.g. if using tauri or 
electron), you can simply create a new fetch function wrapper and pass it into any of the functions you call.

this is the default fetch wrapper:
```ts
async function defaultFetch(
    url: string,
    method: string,
    AUTHORIZATION: string,
    xGuestToken: string = "", // must include default value of `""`
    ): Promise<any> {
    
    const headers = {
        "authorization": AUTHORIZATION,
    };
    if (xGuestToken !== "") {
        headers["x-guest-token"] = xGuestToken;
    }
    return await fetch(url, {
            "method": method, // e.g. "GET" or "POST"
            "credentials": "omit",
            "headers": headers,
        })
        .then(r => r.json())
        .catch(() => ({}));
}
```

this is an example for tauri:
```ts
import { fetch } from "@tauri-apps/api/http";

async function tauriFetch(
    url: string,
    method: string,
    AUTHORIZATION: string,
    xGuestToken: string = "",
    ): Promise<any> {
    
    const headers = {
        "authorization": AUTHORIZATION,
    };
    if (xGuestToken !== "") {
        headers["x-guest-token"] = xGuestToken;
    }
    return await fetch(url, {
            "method": method,
            "headers": headers,
        })
        .then(r => r.data)
        .catch(() => ({}));
}

// then call a function with the fetch function as an argument:
const  = await queryToTweets("from:ElonMusk", tauriFetch);
```

## extra info about how to find twitter's private APIs

```
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


-- iT SEEMS THE TWITTER STANDARD V1.1 API ACTUALLY WORKS WITH GUEST TOKEN TOO --

https://developer.twitter.com/en/docs/twitter-api/v1

timeline:
  https://developer.twitter.com/en/docs/twitter-api/v1/tweets/timelines/api-reference/get-statuses-user_timeline

search:
  https://developer.twitter.com/en/docs/twitter-api/v1/tweets/search/overview
```

## TODO
- if thread contains show more button, need to get the next page of tweets
