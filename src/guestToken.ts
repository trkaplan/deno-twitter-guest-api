import { AUTHORIZATION } from "./constants.ts";

export let currentGuestToken: string = await getNewGuestToken();

/**
 * get "x-guest-token" for subsequent requests
 * @returns guest token
 */
export async function getNewGuestToken(): Promise<string> {

    const obj = await fetch("https://api.twitter.com/1.1/guest/activate.json", {
        "method": "POST",
        "credentials": "omit",
        "headers": {
            "authorization": AUTHORIZATION,
        },
    }).then(r => r.json())
        .catch(() => "");
    
    return obj?.guest_token;
}