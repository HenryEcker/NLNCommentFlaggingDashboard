import {getFormDataFromObject, getURLSearchParamsFromObject, sleep} from './Utils';
import {
    AlreadyDeletedError,
    AlreadyFlaggedError,
    CommentFlagResult,
    FlagAttemptFailed,
    IndexedAPIComment,
    OutOfFlagsError,
    RatedLimitedError,
    SECommentAPIResponse,
    SECommentIDOnlyResponse,
    SEFlagResponse
} from './Types';


const timeBetweenRequests = 150; // in ms

async function getActiveComments(
    AUTH_STR: string,
    FROM_DATE: number,
    TO_DATE: number | undefined = undefined,
    pageSize: number
): Promise<Set<number>> {
    // Get all the post ids for all comments in time range
    const commentIdUsp = getURLSearchParamsFromObject({
        'pagesize': pageSize,
        'order': 'desc',
        'sort': 'creation',
        'filter': '!bB.Oyz3JP.A122',
        'fromdate': FROM_DATE,
        'page': 1,
        ...TO_DATE && {'todate': TO_DATE}
    });
    let hasMore = true;
    const postIdSet: Set<number> = new Set();
    while (hasMore) {
        const res = await fetch(`https://api.stackexchange.com/2.3/comments?${commentIdUsp.toString()}&${AUTH_STR}`);
        const resData: SECommentIDOnlyResponse = await res.json();
        resData.items.forEach(e => {
            postIdSet.add(e.post_id);
        });
        hasMore = resData.has_more;
        commentIdUsp.set('page', (resData.page + 1).toString()); // Move to next page
        if (hasMore) {
            await sleep(timeBetweenRequests); // Don't overwhelm the API with requests
        }
    }
    return postIdSet;
}

async function getCommentsFromPostIds(
    AUTH_STR: string,
    pageSize: number,
    postIds: number[]
): Promise<IndexedAPIComment[]> {
    // Get all comments on the corresponding posts
    let data: IndexedAPIComment[] = [];
    const postUsp = getURLSearchParamsFromObject({
        'pagesize': pageSize,
        'order': 'desc',
        'sort': 'creation',
        'filter': '!B8mctK08QdxNYO2U*fwtj6Igw_7BDr',
        'page': 1,
    });
    let hasMore: boolean;
    for (let i = 0; i < postIds.length; i += pageSize) {
        postUsp.set('page', '1');
        hasMore = true;
        while (hasMore) {
            const res = await fetch(`https://api.stackexchange.com/2.3/posts/${postIds.slice(i, i + pageSize).join(';')}?${postUsp.toString()}&${AUTH_STR}`);
            const resData: SECommentAPIResponse = await res.json();
            if (resData.items.length > 0) {
                data = [
                    ...data,
                    ...resData.items.reduce((acc, post) => {

                        const totalComments = post.comments.length;
                        return [
                            ...acc,
                            ...post.comments.map((c, i) => {
                                return {
                                    ...c,
                                    postCommentIndex: i + 1,
                                    totalCommentPosts: totalComments
                                };
                            })
                        ];
                    }, [] as IndexedAPIComment[])
                ];
            }
            hasMore = resData.has_more;
            postUsp.set('page', (resData.page + 1).toString()); // Move to next page
            if (hasMore) {
                await sleep(timeBetweenRequests); // Don't overwhelm the API with requests
            }
        }
    }
    return data;
}


/**
 * Get comments to analyse.
 *
 * @param {string} AUTH_STR Complete Auth String needed to make API requests including site, access_token, and key
 * @param {number} FROM_DATE Beginning of comment window (SE API Timestamp is in seconds not milliseconds)
 * @param {number} TO_DATE End of comment window (SE API Timestamp is in seconds not milliseconds)
 * @returns {Promise<JSON>} Fetch returns a JSON response
 */
export async function getComments(
    AUTH_STR: string,
    FROM_DATE: number,
    TO_DATE: number | undefined = undefined
): Promise<IndexedAPIComment[]> {
    const pageSize = 100;
    const postIdSet: Set<number> = await getActiveComments(AUTH_STR, FROM_DATE, TO_DATE, pageSize);
    return await getCommentsFromPostIds(AUTH_STR, pageSize, [...postIdSet]);
}

/**
 * Fetches the number of flags remaining by "opening" the flag dialogue popup and scraping the HTML
 *
 * @param {number} commentID Any visible comment will work (it just needs a comment to be able to open the flagging dialogue)
 * @returns {Promise<number>} The number of remaining flags
 *
 * @throws {RatedLimitedError} Throws a RateLimitedError when attempting to open the popup too quickly. The popup can only be opened once every 3 seconds (globally)
 */
export function getFlagQuota(commentID: number): Promise<number> {
    return new Promise((resolve, reject) => {
        void $.get(`https://${location.hostname}/flags/comments/${commentID}/popup`)
            .done((data: string) => {
                const pattern = /you have (\d+) flags left today/i;
                const match: RegExpMatchArray | null = $('div:contains("flags left today")', data).filter((idx: number, n: HTMLElement): boolean => n.childElementCount === 0 && Boolean(n.innerText.match(pattern))).last().text().match(pattern);
                if (match !== null) {
                    resolve(Number(match[1]));
                    return;
                } else {
                    resolve(0);
                    return;
                }
            })
            .fail((err: JQuery.jqXHR) => {
                if (err.status === 409) {
                    reject(new RatedLimitedError('You may only load the comment flag dialog every 3 seconds'));
                    return;
                } else {
                    reject();
                    return;
                }
            });
    });
}

/**
 * Flag the comment using an HTML POST to the route. The NLN flag type is hard coded (39).
 *
 * @param {string} fkey Needed to identify the user
 * @param {number} comment_id the ID of the flag to use (NLN = 39)
 * @param {number} flag_id the complete comment object
 * @returns {Promise<CommentFlagResult>} Resolves a CommentFlagResult with information about what happened to the comment
 *
 * @throws {RatedLimitedError} Throws a RateLimitedError when attempting to flag too quickly. The flags can only be added every 5 seconds (globally)
 * @throws {OutOfFlagsError} Throws an OutOfFlagsError when attempting to flag a post without any remaining daily flags.
 * @throws {AlreadyDeletedError} Throws an AlreadyDeletedError when attempting to flag a comment that has already been deleted
 * @throws {FlagAttemptFailed} Throws a FlagAttemptFailed if the flag attempt failed for some other reason than RateLimit, AlreadyFlagged, or Already Deleted.
 */
export function flagComment(fkey: string, comment_id: number, flag_id = 39): Promise<CommentFlagResult> {
    return fetch(`https://${location.hostname}/flags/comments/${comment_id}/add/${flag_id}`, {
        method: 'POST',
        body: getFormDataFromObject({
            'fkey': fkey,
            'otherText': '',
            'overrideWarning': true
        })
    }).then((res: Response) => {
        if (res.status === 409) {
            throw new RatedLimitedError('You can only flag once every 5 seconds');
        } else if (res.status === 200) {
            return res.json();
        } else {
            throw new FlagAttemptFailed(`Something unexpected went wrong. (${res.status}: "${res.statusText}")`);
        }
    }).then((resData: SEFlagResponse) => {
        if (resData.Success && resData.Outcome === 0) {
            return {
                was_deleted: resData.ResultChangedState,
                was_flagged: true
            };
        } else if (!resData.Success && resData.Outcome === 2) {
            if (resData.Message === 'You have already flagged this comment') {
                throw new AlreadyFlaggedError(resData.Message);
            } else if (resData.Message === 'This comment is deleted and cannot be flagged') {
                throw new AlreadyDeletedError(resData.Message);
            } else if (resData.Message.toLowerCase().includes('out of flag')) {
                throw new OutOfFlagsError(resData.Message);
            }
        }
        // General Something else went wrong
        throw new FlagAttemptFailed(resData.Message);
    });
}