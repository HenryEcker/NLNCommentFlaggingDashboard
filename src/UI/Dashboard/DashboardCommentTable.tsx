import {Comment, StackExchangeAPI} from '../../Types';
import {capitalise, displayFormatRegExpMatchArray, formatPercentage} from '../../Utils';
import {DashboardCommentTableDisplaySettings, TableData} from './DashboardTypes';

declare const StackExchange: StackExchangeAPI;


const DashboardPinTh = ({numberOfPinnedComments}: {
    numberOfPinnedComments: number;
}): JSX.Element => {
    const isSingular = numberOfPinnedComments === 1;
    return (
        <th>Pin&nbsp;<span
            title={`There ${isSingular ? 'is' : 'are'} ${numberOfPinnedComments} comment${isSingular ? '' : 's'} pinned.`}>
            ({numberOfPinnedComments})
        </span>
        </th>
    );
};

const DashboardFlagButton = ({comment, handleEnqueueComment}: {
    comment: Comment;
    handleEnqueueComment: (comment_id: number) => void;
}): JSX.Element => {
    if (!comment.can_flag) {
        return <td><span title={'This comment cannot be flagged'}>🚫</span></td>;
    } else if (comment.was_flagged) {
        return <td><span title={'This comment was flagged successfully'}>✓</span></td>;
    } else if (comment.enqueued) {
        return <td>
            <div className={'s-spinner'}>
                <div className={'v-visible-sr'}>Flagging...</div>
            </div>
        </td>;
    } else {
        return <td>
            <button data-comment-id={comment._id}
                    className={'s-btn s-btn__primary'}
                    title={'Click to flag the comment as No Longer Needed'}
                    onClick={ev => {
                        ev.preventDefault();
                        handleEnqueueComment(comment._id);
                    }}>
                Flag
            </button>
        </td>;
    }
};

const DashboardDeleteIndicator = ({comment}: { comment: Comment; }): JSX.Element => {
    if (comment.was_deleted !== undefined) {
        if (comment.was_deleted) {
            return <td><span title={'This comment has been deleted.'}>✓</span></td>;
        } else {
            return <td><span title={'This post has been flagged and is pending moderator evaluation'}
                             className={'supernovabg mod-flag-indicator'}>pending</span></td>;
        }
    } else {
        return <td></td>;
    }
};


const DashboardCommentTable = ({
                                   displaySettings,
                                   tableData,
                                   shouldRenderRow,
                                   handleEnqueueComment,
                                   handleRemoveComment,
                                   handlePinComment
                               }: {
    displaySettings: DashboardCommentTableDisplaySettings;
    tableData: TableData;
    shouldRenderRow: (c: Comment) => boolean;
    handleEnqueueComment: (comment_id: number) => void;
    handleRemoveComment: (comment_id: number) => void;
    handlePinComment: (comment_id: number, pinStatus: boolean) => void;
}): JSX.Element => {
    return (
        <table className={'s-table'}>
            <thead>
            <tr>
                {displaySettings['UI_DISPLAY_PIN_COMMENT'] &&
                    <DashboardPinTh numberOfPinnedComments={Object.values(tableData).filter(c => c?.pinned).length}/>
                }
                <th>Comment Text</th>
                {displaySettings['UI_DISPLAY_COMMENT_OWNER'] && <th>Author</th>}
                {displaySettings['UI_DISPLAY_POST_TYPE'] && <th>Post Type</th>}
                {displaySettings['UI_DISPLAY_POST_ID'] && <th>Post Link</th>}
                {displaySettings['UI_DISPLAY_POST_INDEX'] && <th>Comment No.</th>}
                {displaySettings['UI_DISPLAY_LINK_TO_COMMENT'] && <th>Comment Link</th>}
                {displaySettings['UI_DISPLAY_BLACKLIST_MATCHES'] && <th>Blacklist Matches</th>}
                {displaySettings['UI_DISPLAY_WHITELIST_MATCHES'] && <th>Whitelist Matches</th>}
                {displaySettings['UI_DISPLAY_NOISE_RATIO'] && <th>Noise Ratio</th>}
                {displaySettings['UI_DISPLAY_FLAG_BUTTON'] && <th>Flag</th>}
                {displaySettings['UI_DISPLAY_COMMENT_DELETE_STATE'] && <th>Deleted</th>}
                <th>Clear</th>
            </tr>
            </thead>
            <tbody>
            {
                Object.values(tableData)
                    .filter(shouldRenderRow)
                    .sort((a: Comment, b: Comment): number => {
                        return a.post_id - b.post_id || a._id - b._id;
                    })
                    .map((comment: Comment, index: number) => {
                        return (
                            <tr key={comment._id}>
                                {displaySettings['UI_DISPLAY_PIN_COMMENT'] &&
                                    <td>
                                        <input type={'checkbox'}
                                               className={'s-checkbox'}
                                               id={`nln-pin-${comment._id}`}
                                               title={`(${index + 1}). Check to pin comment to dashboard (ignores filters)`}
                                               onChange={ev => {
                                                   handlePinComment(comment._id, ev.target.checked);
                                               }}
                                               checked={comment?.pinned === true}
                                        />
                                    </td>
                                }
                                <td dangerouslySetInnerHTML={{__html: comment.body}}/>
                                {displaySettings['UI_DISPLAY_COMMENT_OWNER'] && <td>
                                    <a href={comment.owner.link} target={'_blank'} rel={'noreferrer'}>
                                        <span dangerouslySetInnerHTML={{__html: comment.owner.display_name}}/>
                                    </a>
                                </td>}
                                {displaySettings['UI_DISPLAY_POST_TYPE'] && <td>
                                    {capitalise(comment.post_type)}
                                </td>}
                                {displaySettings['UI_DISPLAY_POST_ID'] && <td>
                                    <a href={`/${comment.post_type === 'question' ? 'q' : 'a'}/${comment.post_id}`}
                                       target={'_blank'}
                                       rel={'noreferrer'}
                                       title={'Link to post'}
                                    >
                                        {comment.post_id}
                                    </a>
                                </td>}
                                {displaySettings['UI_DISPLAY_POST_INDEX'] &&
                                    <td>{comment.postCommentIndex}/{comment.totalPostComments}</td>}
                                {displaySettings['UI_DISPLAY_LINK_TO_COMMENT'] && <td>
                                    <a href={comment.link}
                                       target={'_blank'}
                                       rel={'noreferrer'}
                                       title={'Link to comment'}
                                    >
                                        {comment._id}
                                    </a>
                                </td>}
                                {displaySettings['UI_DISPLAY_BLACKLIST_MATCHES'] && <td>
                                    {displayFormatRegExpMatchArray(comment.blacklist_matches)}
                                </td>}
                                {displaySettings['UI_DISPLAY_WHITELIST_MATCHES'] && <td>
                                    {displayFormatRegExpMatchArray(comment.whitelist_matches)}
                                </td>}
                                {displaySettings['UI_DISPLAY_NOISE_RATIO'] && <td>
                                    {formatPercentage(comment.noise_ratio)}
                                </td>}
                                {displaySettings['UI_DISPLAY_FLAG_BUTTON'] &&
                                    <DashboardFlagButton comment={comment}
                                                         handleEnqueueComment={handleEnqueueComment}/>
                                }
                                {displaySettings['UI_DISPLAY_COMMENT_DELETE_STATE'] &&
                                    <DashboardDeleteIndicator comment={comment}/>
                                }
                                <td>
                                    <button
                                        className={'s-btn'}
                                        title={'Click to remove this comment from the Dashboard.'}
                                        onClick={ev => {
                                            ev.preventDefault();
                                            if (comment?.pinned === true) {
                                                void StackExchange.helpers.showConfirmModal(
                                                    {
                                                        title: 'Clear pinned comment',
                                                        bodyHtml: '<span>The comment you are trying to clear is currently pinned. <br/> Are you sure you want to unpin and clear it (this cannot be undone)?</span>',
                                                        buttonLabel: 'Clear Comment',
                                                    }
                                                ).then((confirm: boolean) => {
                                                    if (confirm) {
                                                        handleRemoveComment(comment._id);
                                                    }
                                                });
                                            } else {
                                                handleRemoveComment(comment._id);
                                            }
                                        }}>
                                        Clear
                                    </button>
                                </td>
                            </tr>
                        );
                    })
            }
            </tbody>
        </table>
    );
};

export default DashboardCommentTable;