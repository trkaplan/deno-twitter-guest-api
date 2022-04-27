
/*

deno test --allow-net

deno test --allow-net src/main/urlToRecommendedTweets_test.ts

*/


import { urlToRecommendedTweets } from "../../mod.ts";
import { Tweet } from "../types.ts";
import { assert } from "https://deno.land/std/testing/asserts.ts";


Deno.test({
    name: "urlToRecommendedTweets()",
    fn: async () => {
        const url = "https://twitter.com/epolynya/status/1513868637307691009";
        const tweets: Tweet[] = await urlToRecommendedTweets(url);
        assert(tweets.length > 10)
    }
})
