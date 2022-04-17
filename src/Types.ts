export type PostType = 'question' | 'answer' | 'all';

export interface Comment {
    _id: number,
    post_id: number,
    post_type: PostType,
    body: string,
    link: string,
    blacklist_matches: RegExpMatchArray,
    noise_ratio: number,
    can_flag: boolean,
    was_flagged?: boolean,
    was_deleted?: boolean
}

export interface CommentFlagResult {
    was_deleted: boolean,
    was_flagged: boolean
}

export interface SEFlagResponse {
    Success: boolean,
    Outcome: number,
    ResultChangedState: boolean,
    Message: string
}

export interface APIComment {
    can_flag: boolean,
    post_type: PostType,
    post_id: number,
    comment_id: number,
    body_markdown: string,
    link: string,
    body: string
}

export interface SECommentAPIResponse {
    items: Array<APIComment>,
    has_more: boolean,
    quota_max: number,
    quota_remaining: number
}

export interface FlaggingDashboardConfig {
    displayLink: boolean,
    displayPostType: boolean,
    displayNoiseRatio: boolean,
    displayFlagUI: boolean,
    displayBlacklistMatches: boolean,
    displayCommentDeleteState: boolean,
    shouldUpdateTitle: boolean
}

export interface StackExchange {
    options: {
        user: {
            fkey: string
        }
    }
}

/**
 * Base Class of Errors which share the name with their class name
 */
class SelfNamedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

/**
 * Errors used to differentiate the various failure modes
 */
export class FlagAttemptFailed extends SelfNamedError {
}

export class RatedLimitedError extends FlagAttemptFailed {
}

export class OutOfFlagsError extends FlagAttemptFailed {
}

export class AlreadyDeletedError extends FlagAttemptFailed {
}

export class AlreadyFlaggedError extends FlagAttemptFailed {
}