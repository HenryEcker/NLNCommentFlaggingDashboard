export interface Comment {
    _id: number,
    post_id: number,
    post_type: string,
    body: string,
    link: string,
    blacklist_matches: RegExpMatchArray,
    noise_ratio: number,
    can_flag: boolean,
    was_flagged?: boolean,
    was_deleted?: boolean
}

export interface SEFlagResponse {
    Success: boolean,
    Outcome: number,
    ResultChangedState: boolean,
    Message: string
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

export class RatedLimitedError extends SelfNamedError {
}