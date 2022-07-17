import {useCallback, useEffect, useId, useMemo, useState} from 'react';
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
    } else {
        const isEnqueued = comment?.enqueued === true;
        return <td>
            <button data-comment-id={comment._id}
                    className={`s-btn ${isEnqueued ? 's-btn__outlined is-loading' : 's-btn__primary'}`}
                    title={'Click to flag the comment as No Longer Needed'}
                    onClick={ev => {
                        ev.preventDefault();
                        handleEnqueueComment(comment._id);
                    }}
                    disabled={isEnqueued}>
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

interface ModalDataType {
    filterFunction: (c: Comment) => boolean;
    modalHeaderInnerElement: JSX.Element;
    configurableSettingKey: 'UI_DISPLAY_COMMENT_OWNER' | 'UI_DISPLAY_POST_COMMENTS';
}

interface DashboardCommentTableProps {
    displaySettings: DashboardCommentTableDisplaySettings;
    tableData: TableData;
    shouldRenderRow: (c: Comment) => boolean;
    handleEnqueueComment: (comment_id: number) => void;
    handleRemoveComment: (comment_id: number) => void;
    handlePinComment: (comment_id: number, pinStatus: boolean) => void;
    isModal: boolean;
}

const DashboardCommentTable = (
    {
        displaySettings,
        tableData,
        shouldRenderRow,
        handleEnqueueComment,
        handleRemoveComment,
        handlePinComment,
        isModal
    }: DashboardCommentTableProps
): JSX.Element => {
    const [modalData, setModalData] = useState<ModalDataType | undefined>(undefined);
    const modalId = useId();

    const escapeKeyHandler = useCallback((evt: KeyboardEvent): void => {
        if (evt.key === 'Escape') {
            setModalData(undefined);
        }
    }, [setModalData]);

    /**
     * Bind.unbind escape handler whether modal is active
     */
    useEffect(() => {
        if (modalData !== undefined) {
            document.body.addEventListener('keydown', escapeKeyHandler);
        } else {
            document.body.removeEventListener('keydown', escapeKeyHandler);
        }
    }, [modalData]);

    // Memoise these potentially expensive operations
    const numberOfPinnedComments = useMemo(() => {
        return Object.values(tableData).filter(c => c?.pinned).length;
    }, [tableData]);

    const filteredSortedComments = useMemo(() => {
        return Object.values(tableData)
            .filter(shouldRenderRow)
            .sort((a: Comment, b: Comment): number => {
                return a.post_id - b.post_id || a._id - b._id;
            });
    }, [tableData, shouldRenderRow]);


    return (
        // Only build Modal if is not already modal
        <div {...!isModal && {'data-controller': 's-modal'}}>
            {!isModal && <aside className={'s-modal'}
                                data-s-modal-target={'modal'}
                                id={modalId}
                                tabIndex={-1}
                                role={'dialog'}
                                aria-hidden={'true'}>
                {
                    modalData !== undefined &&
                    <div className={'s-modal--dialog s-modal__full ws10'}
                         role={'document'}>
                        <h1 className={'s-modal--header'}>{modalData.modalHeaderInnerElement}</h1>
                        <div className={'s-modal--body'}>
                            <DashboardCommentTable
                                displaySettings={
                                    {
                                        ...displaySettings,
                                        // Don't display unneeded column (_e.g._ post id is unneeded when displaying all comments on same post)
                                        [modalData.configurableSettingKey]: false
                                    }
                                }
                                tableData={tableData}
                                shouldRenderRow={modalData.filterFunction} // Only filter by post ID nothing else
                                handleEnqueueComment={handleEnqueueComment}
                                handleRemoveComment={handleRemoveComment}
                                handlePinComment={handlePinComment}
                                isModal={true}
                            />
                        </div>
                        <div className={'s-modal--footer'}>
                            <button className={'s-btn s-btn__primary'}
                                    onClick={ev => {
                                        ev.preventDefault();
                                        Object.values(tableData)
                                            .filter(modalData.filterFunction)
                                            .forEach((c: Comment) => {
                                                // Don't clear pinned comments
                                                if (c.pinned !== true) {
                                                    handleRemoveComment(c._id);
                                                }
                                            });
                                        // Close Modal After Clearing
                                        setModalData(undefined);
                                    }}
                                    data-action={'s-modal#hide'}>
                                Clear All and Close
                            </button>
                        </div>
                        <button className={'s-modal--close s-btn s-btn__muted'}
                                type={'button'}
                                aria-label={'@_s(" Close")'}
                                data-action={'s-modal#hide'}>
                            <svg aria-hidden={'true'}
                                 className={'svg-icon iconClearSm'}
                                 width={'14'}
                                 height={'14'}
                                 viewBox={'0 0 14 14'}>
                                <path
                                    d={'M12 3.41 10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7 12 3.41Z'}></path>
                            </svg>
                        </button>
                    </div>
                }
            </aside>}
            <table className={'s-table'}>
                <thead>
                <tr>
                    <DashboardPinTh
                        numberOfPinnedComments={numberOfPinnedComments}/>
                    <th>Comment Text</th>
                    {displaySettings['UI_DISPLAY_COMMENT_OWNER'] && <th>Author</th>}
                    {displaySettings['UI_DISPLAY_POST_TYPE'] && <th>Post Type</th>}
                    {displaySettings['UI_DISPLAY_POST_COMMENTS'] && <th>Post Comments</th>}
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
                    filteredSortedComments
                        .map((comment: Comment, index: number) => {
                            return (
                                <tr key={comment._id}>
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
                                    <td>
                                        <span dangerouslySetInnerHTML={{__html: comment.body}}
                                              style={{wordBreak: 'break-word'}}/>
                                    </td>
                                    {displaySettings['UI_DISPLAY_COMMENT_OWNER'] && <td>
                                        {isModal ?
                                            <a href={comment.owner.link} target={'_blank'} rel={'noreferrer'}>
                                                <span dangerouslySetInnerHTML={{__html: comment.owner.display_name}}/>
                                            </a>
                                            :
                                            <button
                                                className={'s-btn s-btn__filled js-modal-open'}
                                                type={'button'}
                                                data-action={'s-modal#show'}
                                                onClick={ev => {
                                                    ev.preventDefault();
                                                    setModalData({
                                                        filterFunction: (c: Comment) => c.owner.account_id === comment.owner.account_id,
                                                        configurableSettingKey: 'UI_DISPLAY_COMMENT_OWNER',
                                                        modalHeaderInnerElement: <>
                                                            All Comments by <a
                                                            href={comment.owner.link}
                                                            target={'_blank'}
                                                            rel={'noreferrer'}
                                                            title={'Link to post'}
                                                        >
                                                            <span
                                                                dangerouslySetInnerHTML={{__html: comment.owner.display_name}}/>
                                                        </a>
                                                        </>
                                                    });
                                                }}
                                                title={'Open modal displaying all comments on by this user'}>
                                                <span dangerouslySetInnerHTML={{__html: comment.owner.display_name}}/>
                                            </button>
                                        }
                                    </td>}
                                    {displaySettings['UI_DISPLAY_POST_TYPE'] && <td>
                                        {capitalise(comment.post_type)}
                                    </td>}
                                    {displaySettings['UI_DISPLAY_POST_COMMENTS'] && <td>
                                        {isModal ?
                                            <a href={`/${comment.post_type === 'question' ? 'q' : 'a'}/${comment.post_id}`}
                                               target={'_blank'}
                                               rel={'noreferrer'}
                                               title={'Link to post'}
                                            >
                                                {comment.post_id}
                                            </a>
                                            :
                                            <button
                                                className={'s-btn s-btn__filled js-modal-open'}
                                                type={'button'}
                                                data-action={'s-modal#show'}
                                                onClick={(ev) => {
                                                    ev.preventDefault();
                                                    setModalData({
                                                        filterFunction: (c: Comment) => c.post_id === comment.post_id,
                                                        configurableSettingKey: 'UI_DISPLAY_POST_COMMENTS',
                                                        modalHeaderInnerElement: <>
                                                            All Comments on <a
                                                            href={`/${comment.post_type === 'question' ? 'q' : 'a'}/${comment.post_id}`}
                                                            target={'_blank'}
                                                            rel={'noreferrer'}
                                                            title={'Link to post'}
                                                        >
                                                            {comment.post_id}
                                                        </a>
                                                        </>
                                                    });
                                                }}
                                                title={'Open modal displaying all comments on the post'}>
                                                {comment.post_id}
                                            </button>
                                        }
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
        </div>
    );
};

export default DashboardCommentTable;