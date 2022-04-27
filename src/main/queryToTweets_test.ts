
/*

deno test --allow-net

deno test --allow-net src/main/queryToTweets_test.ts

*/


import { queryToTweets } from "../../mod.ts";
import { assert } from "https://deno.land/std/testing/asserts.ts";


Deno.test({
    name: "queryToTweets() - query that gets tweets",
    fn: async (t) => {
        const query = "from:balajis -filter:replies";
        const tweets = await queryToTweets(query)
        assert(tweets.length > 0);
    }
});

Deno.test({
    name: "queryToTweets() - query that gets no tweets",
    fn: async () => {
        const query = "from:balajis -filter:replies min_faves=999999999";
        const tweets = await queryToTweets(query)
        console.log("LENGTH: ", tweets.length);
        assert(tweets.length == 0);
    }
});

Deno.test({
    name: "queryToTweets() - query that gets only retweets - testing retweet parsing",
    fn: async () => {
        const query = "from:balajis filter:nativeretweets include:nativeretweets";
        const tweets = await queryToTweets(query)
        // console.log("LENGTH: ", tweets.length);
        // console.log(tweets.map(x => x.text));
        assert(tweets.length > 0);
        const tweetTexts = tweets.map(x => x.text);
        for (const text of tweetTexts) {
            // throws error if finds a retweet
            assert(! text.match(/^RT @.+?: /));
        }
    }
});
