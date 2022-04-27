
/*

deno test --allow-net

deno test --allow-net src/main/queryToTweets_test.ts

*/


import { queryToTweets } from "../../mod.ts";
import { Tweet } from "../types.ts";
import { assert } from "https://deno.land/std/testing/asserts.ts";


Deno.test({
    name: "queryToTweets() - query that gets tweets",
    fn: async (t) => {
        const query = "query=from:balajis+-filter:replies";
        const tweets: Tweet[] = await queryToTweets(query)
        assert(tweets.length > 0);
    }
});

Deno.test({
    name: "queryToTweets() - query that gets no tweets",
    fn: async () => {
        const query = "query=from:balajis+-filter:replies+min_faves=999999999";
        const tweets: Tweet[] = await queryToTweets(query)
        assert(tweets.length == 0);
    }
});
