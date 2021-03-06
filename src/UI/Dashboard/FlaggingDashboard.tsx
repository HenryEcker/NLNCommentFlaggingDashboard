import {useCallback, useEffect, useMemo, useState} from 'react';
import {
    AlreadyDeletedError,
    AlreadyFlaggedError,
    Comment,
    CommentFlagResult,
    FlagAttemptFailed,
    IndexedAPIComment,
    OutOfFlagsError,
    PostType,
    RatedLimitedError
} from '../../Types';
import DashboardSettingsComponent from './SettingComponents/DashboardSettingsComponent';
import DashboardCommentTable from './DashboardCommentTable';
import {calcNoiseRatio, getCurrentTimestamp, htmlDecode} from '../../Utils';
import {flagComment, getComments, getFlagQuota} from '../../SE_API';
import {blacklist, whitelist} from '../../GlobalVars';
import DashboardCommentManagementControls from './ManagementControls/DashboardCommentManagementControls';
import DashboardHeader from './DashboardHeader';
import globalFlagQueue from './FlagQueue/FlagQueue';
import {ConfigurableSettings, FlaggingDashboardProps, TableData} from './DashboardTypes';
import styles from './FlaggingDashboard.module.scss';
import {commentWasHandled, handlePreventPageUnload, postTypeFilter} from './DashboardUtils';


const FlaggingDashboard = (
    {
        authStr, apiRequestRate, fkey, settings, dashboardCommentDisplaySettings, toaster
    }: FlaggingDashboardProps
): JSX.Element => {
    const [tableData, setTableData] = useState<TableData>({});
    const tableDataSize = useMemo(() => {
        return Object.keys(tableData).length;
    }, [tableData]);

    useEffect(() => {
        // Prevent navigation away if there are values in the table
        if (tableDataSize > 0) {
            window.addEventListener('beforeunload', handlePreventPageUnload);
        } else {
            window.removeEventListener('beforeunload', handlePreventPageUnload);
        }
    }, [tableDataSize]);

    const [seenCommentIds,] = useState<Set<number>>(new Set<number>());
    const [configurableSettings, setConfigurableSettings] = useState<ConfigurableSettings>({
        DISPLAY_CERTAINTY: settings.get('DISPLAY_CERTAINTY') as number,
        MAXIMUM_LENGTH_COMMENT: settings.get('MAXIMUM_LENGTH_COMMENT') as number,
        POST_TYPE: settings.get('POST_TYPE') as PostType,
        FILTER_WHITELIST: settings.get('FILTER_WHITELIST') as boolean
    });
    const [remainingFlagCount, setRemainingFlagCount] = useState<number | undefined>(undefined);
    /**
     * Fetch remaining comment count from flagging dialogue and update remainingFlagCount
     */
    const pullDownRemainingFlagsFromFlagDialogue = useCallback(async (commentID: number): Promise<void> => {
        if (settings.get('UI_DISPLAY_REMAINING_FLAGS')) {
            try {
                const flagsRemaining = await getFlagQuota(commentID);
                setRemainingFlagCount(flagsRemaining);
            } catch (err) {
                // Pass (It doesn't really matter whether the flag count is updated or not)
            }
        }
    }, [setRemainingFlagCount]);

    /**
     * Handle the Flagging of the comment and update the TableData with the result
     */
    const handleFlagComment = useCallback(async (commentId: number) => {
        // Get remaining flag amount (Need to do this before flagging because it's not accessible after the comment was deleted)
        await pullDownRemainingFlagsFromFlagDialogue(commentId);
        // Do Flag
        try {
            const result: CommentFlagResult = await flagComment(fkey, commentId);
            setTableData(oldTableData => {
                return {
                    ...oldTableData,
                    [commentId]: {
                        ...oldTableData[commentId],
                        was_flagged: result.was_flagged,
                        was_deleted: result.was_deleted,
                    }
                };
            });
            setRemainingFlagCount(rF => {
                // Only becomes a number if UI_DISPLAY_REMAINING_FLAGS is true
                if (rF === undefined) {
                    return undefined;
                } else {
                    return rF - 1;// A Flag was consumed
                }
            });
        } catch (err) {
            if (err instanceof RatedLimitedError) {
                toaster.open('Flagging too fast!', 'error');
            } else if (err instanceof AlreadyFlaggedError) {
                toaster.open(err.message, 'warning', 1000);

                setTableData(oldTableData => {
                    return {
                        ...oldTableData,
                        [commentId]: {
                            ...oldTableData[commentId],
                            was_flagged: true,
                            was_deleted: false
                        }
                    };
                });
            } else if (err instanceof AlreadyDeletedError) {
                toaster.open(err.message, 'error', 1000);

                setTableData(oldTableData => {
                    return {
                        ...oldTableData,
                        [commentId]: {
                            ...oldTableData[commentId],
                            can_flag: false,
                            was_deleted: true
                        }
                    };
                });
            } else if (err instanceof OutOfFlagsError || err instanceof FlagAttemptFailed) {
                toaster.open(err.message, 'error', 8000);
                setTableData(oldTableData => {
                    return {
                        ...oldTableData,
                        [commentId]: {
                            ...oldTableData[commentId],
                            can_flag: false
                        }
                    };
                });
            }
        } finally {
            setTableData(oldTableData => {
                return {
                    ...oldTableData,
                    [commentId]: {
                        ...oldTableData[commentId],
                        enqueued: false
                    }
                };
            });
        }
    }, [pullDownRemainingFlagsFromFlagDialogue, setTableData, setRemainingFlagCount]);


    const processesCommentsAndUpdateTableData = useCallback((comments: IndexedAPIComment[]) => {
        setTableData(oldTableData => {
            return {
                ...oldTableData,
                ...comments.reduce((acc: TableData, currComment) => {
                    const hasOwnCommentId = Object.hasOwn(oldTableData, currComment.comment_id);
                    if (seenCommentIds.has(currComment.comment_id)) {
                        if (!hasOwnCommentId) {
                            return acc;
                        }
                    } else {
                        seenCommentIds.add(currComment.comment_id);
                    }

                    const decodedMarkdown = htmlDecode(currComment.body_markdown) || '';
                    const blacklistMatches = decodedMarkdown.replace(/`.*`/g, '').match(blacklist) || []; // exclude code from analysis

                    const noiseRatio = calcNoiseRatio(
                        blacklistMatches,
                        decodedMarkdown.replace(/\B@\w+/g, '').length// Don't include at mentions in length of string
                    );
                    acc[currComment.comment_id] = {
                        ...hasOwnCommentId && oldTableData[currComment.comment_id],
                        can_flag: currComment.can_flag,
                        body: currComment.body,
                        body_markdown: currComment.body_markdown,
                        body_markdown_length: decodedMarkdown.length,
                        owner: currComment.owner,
                        link: currComment.link,
                        _id: currComment.comment_id,
                        post_id: currComment.post_id,
                        post_type: currComment.post_type,
                        blacklist_matches: blacklistMatches,
                        whitelist_matches: decodedMarkdown.match(whitelist) || [],
                        noise_ratio: noiseRatio,
                        postCommentIndex: currComment.postCommentIndex,
                        totalPostComments: currComment.totalCommentPosts
                    };
                    return acc;
                }, {} as TableData)
            };
        });
    }, [setTableData, seenCommentIds]);


    /**
     * Define and start interval to pull down comments
     */
    useEffect(() => {
        // Prime last successful read
        let lastSuccessfulRead: number = Math.floor((getCurrentTimestamp() - apiRequestRate) / 1000);
        const pullDownComments = async () => {
            const toDate = Math.floor(getCurrentTimestamp() / 1000);
            const comments: IndexedAPIComment[] = await getComments(
                authStr,
                lastSuccessfulRead,
                toDate
            );
            if (comments.length > 0) {
                // Update last successful read time
                lastSuccessfulRead = toDate + 1;
                // Pass comments to update
                processesCommentsAndUpdateTableData(comments);
            }
        };
        if (settings.get('RUN_IMMEDIATELY') as boolean) {
            void pullDownComments();
        }
        window.setInterval(pullDownComments, apiRequestRate);
        // Prevent accidental navigation away
    }, [setTableData, seenCommentIds]);


    const handleBackFillComments = useCallback(async (offsetInMilliseconds: number) => {
        const comments: IndexedAPIComment[] = await getComments(
            authStr,
            Math.floor((getCurrentTimestamp() - offsetInMilliseconds) / 1000), // fromDate
            Math.floor(getCurrentTimestamp() / 1000) // toDate
        );
        if (comments.length > 0) {
            // Pass comments to update
            processesCommentsAndUpdateTableData(comments);
        }
    }, [processesCommentsAndUpdateTableData]);


    /**
     * Determine if row should be rendered or not
     */
    const shouldRenderRow = useCallback((comment: Comment): boolean => {
        // Pinned/queued comments should always render
        if (comment?.pinned === true || comment?.enqueued === true) {
            return true;
        }
        return postTypeFilter(configurableSettings.POST_TYPE, comment.post_type) &&
            (!configurableSettings.FILTER_WHITELIST || comment.whitelist_matches.length === 0) &&
            comment.body_markdown_length <= configurableSettings.MAXIMUM_LENGTH_COMMENT &&
            comment.noise_ratio >= configurableSettings.DISPLAY_CERTAINTY;
    }, [configurableSettings]);

    /**
     * Handle removing a comment from table
     */
    const handleRemoveComment = useCallback((commentId: number) => {
        setTableData(oldTableData => {
            if (oldTableData[commentId]?.enqueued === true) {
                toaster.open(
                    'Comments that are queued cannot be cleared',
                    'error',
                    3000
                );
                return oldTableData;
            }
            const newTableData = {...oldTableData};
            delete newTableData[commentId];
            return newTableData;
        });
    }, [setTableData]);

    /**
     * Handle pinning (and unpinning) comments
     */
    const handlePinComment = useCallback((commentId: number, pinStatus: boolean) => {
        setTableData(oldTableData => {
            return {
                ...oldTableData,
                [commentId]: {
                    ...oldTableData[commentId],
                    pinned: pinStatus
                }
            };
        });
    }, [setTableData]);

    /**
     * Add flag to global flag queue
     * Also update comment in table to be enqueued (creates spinner effect)
     */
    const handleEnqueueComment = useCallback((commentId: number) => {
        setTableData(oldTableData => {
            globalFlagQueue.enqueue({
                id: commentId,
                task: () => {
                    return handleFlagComment(commentId);
                }
            });
            // Update Table Data to show as enqueued
            return {
                ...oldTableData,
                [commentId]: {
                    ...oldTableData[commentId],
                    enqueued: true,
                    pinned: true // Also pin so that it stays visible in dashboard
                }
            };
        });
    }, [setTableData, handleFlagComment]);


    /**
     * Remove the pending task from the flagQueue
     * also update comment in table to un-enqueue the comment
     */
    const handleUnqueueComment = useCallback((commentId: number) => {
        setTableData(oldTableData => {
            globalFlagQueue.removeFromQueue(commentId);
            // Update Table Data to show it's no longer enqueued
            return {
                ...oldTableData,
                [commentId]: {
                    ...oldTableData[commentId],
                    enqueued: false
                }
            };
        });
    }, [setTableData, handleFlagComment]);

    /**
     * Update Page Title based on number of visible and actionable comments
     */
    useEffect(() => {
        if (settings.get('DOCUMENT_TITLE_SHOULD_UPDATE')) {
            const pending = Object.values(tableData).reduce((acc, comment) => {
                if (shouldRenderRow(comment) && !commentWasHandled(comment)) {
                    return acc + 1;
                } else {
                    return acc;
                }
            }, 0);


            let title = document.title.replace(/^\(\d+\)\s+/, '');
            if (pending > 0) {
                title = `(${pending}) ${title}`;
            }
            document.title = title;
        }
    }, [shouldRenderRow, tableData]);

    return (
        <div className={styles['comment-wrapper']}>
            <DashboardHeader/>
            <DashboardSettingsComponent settings={settings}
                                        configurableSettings={configurableSettings}
                                        setConfigurableSettings={setConfigurableSettings}
            />
            <DashboardCommentManagementControls setTableData={setTableData}
                                                tableDataSize={tableDataSize}
                                                shouldDisplayTotal={settings.get('TOTAL_NUMBER_OF_POSTS_IN_MEMORY') as boolean}
                                                shouldRenderRow={shouldRenderRow}
                                                remainingFlagCount={remainingFlagCount}
                                                handleBackFillComments={settings.get('UI_DISPLAY_BACK_FILL_BUTTON') ? handleBackFillComments : undefined}
            />
            <DashboardCommentTable displaySettings={dashboardCommentDisplaySettings}
                                   tableData={tableData}
                                   shouldRenderRow={shouldRenderRow}
                                   handleEnqueueComment={handleEnqueueComment}
                                   handleUnqueueComment={handleUnqueueComment}
                                   handleRemoveComment={handleRemoveComment}
                                   handlePinComment={handlePinComment}
                                   isModal={false}
            />
        </div>
    );
};

export default FlaggingDashboard;