export async function defaultFetch(
    url: string,
    method: string,
    AUTHORIZATION: string,
    xGuestToken: string = "",
    ): Promise<any> {
    
    const headers: any = {
        "authorization": AUTHORIZATION,
    };
    if (xGuestToken !== "") {
        headers["x-guest-token"] = xGuestToken;
    }
    return await fetch(url, {
            "method": method,
            "credentials": "omit",
            "headers": headers,
        })
        .then(r => r.json())
}