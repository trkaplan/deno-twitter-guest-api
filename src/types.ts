/**
 * @param id id number of tweet (last part of url)
 * @param user username of the account who posted the tweet
 * @param text the text of the tweet
 */
export interface Tweet {
    id: string;
    user: string;
    text: string;
    media?: TweetMedia[];
    urls?: TweetURLs[];
    quote?: Quote;
    isThread?: boolean;
}
/**
 * @param twitterLink the twitter shortened url
 * @param url the original image url
 * @param type photo or video
 */
export interface TweetMedia {
    twitterLink: string;
    url: string;
    type: string;
}
/**
 * @param twitterLink the twitter shortened url
 * @param url the original url
 */
export interface TweetURLs {
    twitterLink: string;
    url: string;
}
/**
 * @param url the url of the quoted tweet
 */
export interface Quote extends Tweet {
    url?: any;
}