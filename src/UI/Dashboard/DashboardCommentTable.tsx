import {Comment, DashboardCommentTableDisplaySettings, TableData} from '../../Types';
import {capitalise, formatPercentage} from '../../Utils';


const DashboardFlagButton = ({comment, handleEnqueueComment}: {
    comment: Comment;
    handleEnqueueComment: (comment_id: number) => void;
}): JSX.Element => {
    if (!comment.can_flag) {
        return <td>🚫</td>;
    } else if (comment.was_flagged) {
        return <td>✓</td>;
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
            return <td>✓</td>;
        } else {
            return <td><span className={'supernovabg mod-flag-indicator'}>pending</span></td>;
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
                                   handleRemoveComment
                               }: {
    displaySettings: DashboardCommentTableDisplaySettings;
    tableData: TableData;
    shouldRenderRow: (c: Comment) => boolean;
    handleEnqueueComment: (comment_id: number) => void;
    handleRemoveComment: (comment_id: number) => void;
}): JSX.Element => {
    return (
        <table className={'s-table'}>
            <thead>
            <tr>
                <th>Comment Text</th>
                {displaySettings['UI_DISPLAY_COMMENT_OWNER'] && <th>Author</th>}
                {displaySettings['UI_DISPLAY_POST_TYPE'] && <th>Post Type</th>}
                {displaySettings['UI_DISPLAY_LINK_TO_COMMENT'] && <th>Link</th>}
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
                        const tA = a.pulled_date.getTime();
                        const tB = b.pulled_date.getTime();
                        if (tA === tB) {
                            if (a.post_id === b.post_id) {
                                return a._id - b._id;
                            }
                            return a.post_id - b.post_id;
                        }
                        return tA - tB;
                    })
                    .map((comment: Comment) => {
                        return (
                            <tr key={comment._id}>
                                <td dangerouslySetInnerHTML={{__html: comment.body}}/>
                                {displaySettings['UI_DISPLAY_COMMENT_OWNER'] && <td>
                                    <a href={comment.owner.link} target="_blank">
                                        <span dangerouslySetInnerHTML={{__html: comment.owner.display_name}}/>
                                    </a>
                                </td>}
                                {displaySettings['UI_DISPLAY_POST_TYPE'] && <td>
                                    {capitalise(comment.post_type)}
                                </td>}
                                {displaySettings['UI_DISPLAY_LINK_TO_COMMENT'] && <td>
                                    <a href={comment.link} target="_blank">{comment._id}</a>
                                </td>}
                                {displaySettings['UI_DISPLAY_BLACKLIST_MATCHES'] && <td>
                                    {comment.blacklist_matches.map((e: string) => `"${e}"`).join(', ')}
                                </td>}
                                {displaySettings['UI_DISPLAY_WHITELIST_MATCHES'] && <td>
                                    {comment.whitelist_matches.map((e: string) => `"${e}"`).join(', ')}
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
                                        className="s-btn"
                                        onClick={ev => {
                                            ev.preventDefault();
                                            handleRemoveComment(comment._id);
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