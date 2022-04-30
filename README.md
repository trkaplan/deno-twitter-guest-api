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
