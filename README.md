# Deno twitter guest api

Basic twitter api for [Deno](https://deno.land) that doesn't require you to have a twitter account to use.

## Use

```js
import {
    getSearchQueryTweetsFromQuery,
    getTweetsFromURL,
    getRecommendedTweetsFromURL
} from "https://deno.land/x/deno_twitter_guest_api@v0.1.0/mod.ts";
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
## fetch compatibility

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
}

// then call a function with the fetch function as an argument:
const  = await queryToTweets("from:ElonMusk", tauriFetch);
```