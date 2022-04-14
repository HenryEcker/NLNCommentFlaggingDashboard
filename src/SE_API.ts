import {getFormDataFromObject, getURLSearchParamsFromObject} from "./Utils";
import {Comment, FlagAttemptFailed, RatedLimitedError, SECommentAPIResponse, SEFlagResponse} from "./Types";


/**
 * Get comments to analyse.
 *
 * @param {string} AUTH_STR Complete Auth String needed to make API requests including site, access_token, and key
 * @param {string} COMMENT_FILTER API Filter to specify the returned fields
 * @param {number} FROM_DATE Beginning of comment window (SE API Timestamp is in seconds not milliseconds)
 * @param {number} TO_DATE End of comment window (SE API Timestamp is in seconds not milliseconds)
 * @returns {Promise<JSON>} Fetch returns a JSON response
 */
export function getComments(
    AUTH_STR: string,
    COMMENT_FILTER: string,
    FROM_DATE: number,
    TO_DATE: number | undefined = undefined
): Promise<SECommentAPIResponse> {
    const usp = getURLSearchParamsFromObject({
        'pagesize': 100,
        'order': 'desc',
        'sort': 'creation',
        'filter': COMMENT_FILTER,
        'fromdate': FROM_DATE,
        ...(TO_DATE && {'todate': TO_DATE})
    });
    return fetch(`https://api.stackexchange.com/2.3/comments?${usp.toString()}&${AUTH_STR}`)
        .then(res => res.json())
        .then(resData => resData as SECommentAPIResponse);
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
        $.get(`https://${location.hostname}/flags/comments/${commentID}/popup`)
            .done((data: string) => {
                const pattern = /you have (\d+) flags left today/i;
                const match: RegExpMatchArray | null = $('div:contains("flags left today")', data).filter((idx: number, n: HTMLElement): boolean => (n.childElementCount === 0) && Boolean(n.innerText.match(pattern))).last().text().match(pattern);
                if (match !== null) {
                    return resolve(Number(match[1]));
                } else {
                    return resolve(0)
                }
            })
            .fail((err: JQuery.jqXHR) => {
                if (err.status === 409) {
                    throw new RatedLimitedError("You may only load the comment flag dialog every 3 seconds");
                } else {
                    return reject();
                }
            });
    });
}

/**
 * Flag the comment using an HTML POST to the route. The NLN flag type is hard coded (39).
 *
 * @param {string} fkey Needed to identify the user
 * @param {Comment} comment the complete comment object
 * @returns {Promise<Comment>} Resolves with a new comment object with appropriate fields set to indicate if the flag was successful and how the comment responded to the flag
 *
 * @throws {RatedLimitedError} Throws a RateLimitedError when attempting to flag too quickly. The flags can only be added every 5 seconds (globally)
 * @throws {FlagAttemptFailed} Throws a FlagAttemptFailed if the flag attempt failed for some other reason than RateLimit, AlreadyFlagged, or Already Deleted.
 */
export function flagComment(fkey: string, comment: Comment): Promise<Comment> {
    return new Promise<Comment>((resolve) => {
        fetch(`https://${location.hostname}/flags/comments/${comment._id}/add/39`, {
            method: "POST",
            body: getFormDataFromObject({
                'fkey': fkey,
                'otherText': "",
                'overrideWarning': true
            })
        }).then((res: Response) => {
            if (res.status === 409) {
                throw new RatedLimitedError("You can only flag once every 5 seconds");
            } else if (res.status === 200) {
                return res.json();
            }
        }).then((resData: SEFlagResponse) => {
            if (resData.Success && resData.Outcome === 0) {
                comment.was_flagged = true;
                comment.was_deleted = resData.ResultChangedState
            } else if (!resData.Success && resData.Outcome === 2) {
                if (resData.Message === "You have already flagged this comment") {
                    comment.was_flagged = true;
                    comment.was_deleted = false;
                } else if (resData.Message === "This comment is deleted and cannot be flagged") {
                    comment.can_flag = false;
                    comment.was_flagged = false; // This might have been previously flagged by you, but this flag attempt did not result in a flag
                    comment.was_deleted = true;
                } else if (resData.Message.toLowerCase().includes('out of flag')) {
                    comment.can_flag = false;
                    comment.was_flagged = false;
                } else {
                    throw new FlagAttemptFailed(resData.Message);
                }
            }
            return resolve(comment);
        });
    })
}