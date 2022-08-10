import { AUTHORIZATION } from "../constants.ts";
import { defaultFetch } from "./defaultFetch.ts";

// might not be able to gett token if default fetch function incompatible, but 
// if fetch wrapper passed in, it will get token on 2nd try
export let currentGuestToken: string = await newGuestToken() || "fake-token";

/**
 * get "x-guest-token" for subsequent requests
 * @returns guest token
 */
export async function newGuestToken(
    fetchFn: (url: string, method: string, AUTHORIZATION: string, xGuestToken: string) => Promise<any> = defaultFetch
    ): Promise<string> {
    const url = "https://api.twitter.com/1.1/guest/activate.json";
    const obj = await fetchFn(url, "POST", AUTHORIZATION, "") // had to do add `xGuestToken` arg ("") bc typescript made me :(
        .catch(() => {
            console.log("Error fetching guest token");
            return {}
        });
    return obj?.guest_token;
}