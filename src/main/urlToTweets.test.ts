
/*

deno test --allow-net

deno test --allow-net src/main/urlToTweets.test.ts

*/


import { urlToTweets } from "../../mod.ts";
import { Tweet } from "../types.ts";
import { assert } from "https://deno.land/std/testing/asserts.ts";


// text only tweets

Deno.test({
    name: "urlToTweets() :: thread, 1st-tweet",
    fn: async () => {
        const url = "https://twitter.com/epolynya/status/1513868637307691009";
        const tweets: Tweet[] = await urlToTweets(url);
        assert(tweets.length > 1)
    }
});

Deno.test({
    name: "urlToTweets() :: thread, mid-tweet",
    fn: async () => {
        const url = "https://twitter.com/epolynya/status/1513868642974244866";
        const tweets: Tweet[] = await urlToTweets(url);
        assert(tweets.length == 1)
    }
});

Deno.test({
    name: "urlToTweets() :: thread, last-tweet",
    fn: async () => {
        const url = "https://twitter.com/epolynya/status/1513376048594882560";
        const tweets: Tweet[] = await urlToTweets(url);
        assert(tweets.length == 1)
    }
});

Deno.test({
    name: "urlToTweets() :: not thread",
    fn: async () => {
        const url = "https://twitter.com/epolynya/status/1515896927828672514";
        const tweets: Tweet[] = await urlToTweets(url);
        assert(tweets.length == 1)
    }
});

Deno.test({
    name: "urlToTweets() :: reply, not thread, items after reply",
    fn: async () => {
        const url = "https://twitter.com/OngoingStudy/status/1515926538662862850";
        const tweets: Tweet[] = await urlToTweets(url);
        assert(tweets.length == 1)
    }
});

Deno.test({
    name: "urlToTweets() :: reply, not thread, no items after reply",
    fn: async () => {
        const url = "https://twitter.com/ForbiddenSec/status/1514247615159975940";
        const tweets: Tweet[] = await urlToTweets(url);
        assert(tweets.length == 1)
    }
});

Deno.test({
    name: "urlToTweets() :: reply, thread, 1st-tweet",
    fn: async () => {
        const url = "https://twitter.com/epolynya/status/1514815632511963144";
        const tweets: Tweet[] = await urlToTweets(url);
        assert(tweets.length > 1)
    }
});

// can't find yet

// Deno.test({
//     name: "urlToTweets() :: reply, thread, mid-tweet",
//     fn: async () => {
//         const url = "";
//         const tweets: Tweet[] = await urlToTweets(url);
//         assert(tweets.length == 1)
//     }
// });

Deno.test({
    name: "urlToTweets() :: reply, thread, last-tweet",
    fn: async () => {
        const url = "https://twitter.com/epolynya/status/1514816123677540355";
        const tweets: Tweet[] = await urlToTweets(url);
        assert(tweets.length == 1)
    }
});

// Deno.test({
//     name: "urlToTweets() :: reply, not thread",
//     fn: async () => {
//         const url = "";
//         const tweets: Tweet[] = await urlToTweets(url);
//         assert(tweets.length == 1)
//     }
// });



// Deno.test({
//     name: "urlToTweets() :: reply, not thread",
//     fn: async () => {
//         const url = "";
//         const tweets: Tweet[] = await urlToTweets(url);
//         assert(tweets.length == 1)
//     }
// });

Deno.test({
    name: "urlToTweets() :: first tweet, thread, quote tweet",
    fn: async  () => {
        const url = "https://twitter.com/balajis/status/1505385989191073793";
        const tweets: Tweet[] = await urlToTweets(url);

        // console.log(tweets[0])
        // console.log(tweets[0]?.quote?.text)
        // console.log(tweets[0]?.text)

        assert(tweets.length > 1)
    }
})