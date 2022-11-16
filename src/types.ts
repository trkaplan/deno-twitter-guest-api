
export type Option<T> = T | null;
export type FetchFn = (url: string, method: string, AUTHORIZATION: string, xGuestToken: string) => Promise<any>;

/**
 * @param id id number of tweet (last part of url)
 * @param user username of the account who posted the tweet
 * @param text the text of the tweet
 * @param threadId id of the first tweet in the thread this tweet is in
 */
export interface Tweet {
    id: string,
    user: string,
    text: string,
    media?: Option<TweetMedia[]>,
    urls?: Option<TweetURLs[]>,
    quote?: Option<Tweet>,
    threadId?: Option<string>,
    extra?: Option<TweetExtra>,
}
/**
 * @param shortenedImgURL the twitter shortened url
 * @param fullImgURL the original image url
 * @param kind photo or video
 */
export interface TweetMedia {
    shortenedImgUrl: string,
    fullImgUrl: string,
    kind: string,
    videoUrl: Option<string>,
}
/**
 * @param shortenedURL the twitter shortened url
 * @param fullURL the original url
 */
export interface TweetURLs {
    shortenedUrl: string,
    fullUrl: string,
}
interface TweetExtra {
    date: string,
    retweetedBy: Option<string[]>,
    faves: number,
}
