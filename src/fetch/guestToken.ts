import { AUTHORIZATION } from "../constants.ts";
import { defaultFetch } from "./defaultFetch.ts";
import { FetchFn } from "../types.ts";

export let currentGuestToken: string = "";

/**
 * get "x-guest-token" for subsequent requests
 * @returns guest token
 */
export async function newGuestToken(fetchFn: FetchFn = defaultFetch): Promise<string> {
    const url = "https://api.twitter.com/1.1/guest/activate.json";
    const obj = await fetchFn(url, "POST", AUTHORIZATION, "") // had to do add `xGuestToken` arg ("") bc typescript made me :(
        .catch(() => {
            console.log("Error fetching guest token");
            return {}
        });
    return obj?.guest_token;
}