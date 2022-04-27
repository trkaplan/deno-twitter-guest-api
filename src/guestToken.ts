import { AUTHORIZATION } from "./constants.ts";

export let currentGuestToken: string = await newGuestToken();

/**
 * get "x-guest-token" for subsequent requests
 * @returns guest token
 */
export async function newGuestToken(): Promise<string> {

    const obj = await fetch("https://api.twitter.com/1.1/guest/activate.json", {
        "method": "POST",
        "credentials": "omit",
        "headers": {
            "authorization": AUTHORIZATION,
        },
    }).then(r => r.json())
        .catch(() => {
            console.log("Error fetching guest token");
            return ""
        });
    
    return obj?.guest_token;
}