import { AUTHORIZATION } from "../constants.ts";
import { defaultFetch } from "./defaultFetch.ts";

// don't initialize the token yet bc need user to be able to pass their own 
// fetch function in
export let currentGuestToken: string;

/**
 * get "x-guest-token" for subsequent requests
 * @returns guest token
 */
export async function newGuestToken(
    fetchFn: (url: string, method: string, AUTHORIZATION: string) => Promise<any> = defaultFetch
    ): Promise<string> {
    const url = "https://api.twitter.com/1.1/guest/activate.json";
    const obj = await fetchFn(url, "POST", AUTHORIZATION)
        .catch(() => {
            console.log("Error fetching guest token");
            return {}
        });
    return obj?.guest_token;
}