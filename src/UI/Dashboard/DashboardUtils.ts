import {Comment, PostType} from '../../Types';

/**
 * Determine if row has already been handled
 */
export const commentWasHandled = (comment: Comment): boolean => {
    return !comment.can_flag || comment?.was_flagged === true || comment?.was_deleted === true;
};


export const postTypeFilter = (configPostType: PostType, postType: PostType): boolean => {
    if (configPostType === 'all') {
        return true;
    } else {
        return configPostType === postType;
    }
};

export const handlePreventPageUnload = (ev: BeforeUnloadEvent): void => {
    ev.preventDefault();
    ev.returnValue = '';
};


export const buildClearCommentFragment = (numberOfComments: number) => {
    return numberOfComments === 1 ? 'the 1 comment' : `all ${numberOfComments} comments`;
};