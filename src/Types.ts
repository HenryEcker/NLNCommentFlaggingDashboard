export type PostType = 'question' | 'answer' | 'all';

export interface Comment {
    _id: number;
    post_id: number;
    post_type: PostType;
    body: string;
    body_markdown: string;
    body_markdown_length: number; // can't use raw body_markdown length because " counts as length 1 though it is encoded as &quot; (length 6)
    owner: APICommentOwner;
    link: string;
    blacklist_matches: RegExpMatchArray;
    whitelist_matches: RegExpMatchArray;
    noise_ratio: number;
    can_flag: boolean;
    was_flagged?: boolean;
    was_deleted?: boolean;
    enqueued?: boolean;
    pinned?: boolean;
}

export interface CommentFlagResult {
    was_deleted: boolean;
    was_flagged: boolean;
}

export interface SEFlagResponse {
    Success: boolean;
    Outcome: number;
    ResultChangedState: boolean;
    Message: string;
}

export interface APICommentOwner {
    account_id: number;
    reputation: number;
    user_id: number;
    display_name: string;
    link: string;
}

export interface APIComment {
    owner: APICommentOwner;
    can_flag: boolean;
    post_type: PostType;
    post_id: number;
    comment_id: number;
    body_markdown: string;
    link: string;
    body: string;
}

export interface SEAPIResponseWrapper {
    has_more: boolean;
    quota_max: number;
    quota_remaining: number;
    page: number;
}

export interface SECommentIDOnlyResponse extends SEAPIResponseWrapper {
    items: {
        post_id: number;
    }[];
}

export interface SECommentAPIResponse extends SEAPIResponseWrapper {
    items: APIComment[];
}

/**
 * Modal Options can have:
 *   - title OR titleHtml but not both [required]
 *   - body OR bodyHtml but not both [required]
 *   - neither buttonLabel NOR buttonLabelHtml [optional] OR either buttonLabel OR buttonLabelHtml but not both
 */
type ShowConfirmModalOptions =
    ({ title: string; titleHtml?: never; } | { title?: never; titleHtml: string; })
    & ({ body: string; bodyHtml?: never; } | { body?: never; bodyHtml: string; })
    & ({ buttonLabel?: string; buttonLabelHtml?: never; } | { buttonLabel?: never; buttonLabelHtml: string; });

export interface StackExchangeAPI {
    options: {
        user: {
            fkey: string;
        };
    };
    helpers: {
        showConfirmModal: (options: ShowConfirmModalOptions) => Promise<boolean>;
    };
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