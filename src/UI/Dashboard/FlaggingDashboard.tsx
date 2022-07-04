import {useCallback, useEffect, useState} from 'react';
import {
    AlreadyDeletedError,
    AlreadyFlaggedError,
    APIComment,
    Comment,
    CommentFlagResult,
    ConfigurableSettings,
    FlagAttemptFailed,
    FlaggingDashboardProps,
    OutOfFlagsError,
    PostType,
    RatedLimitedError,
    TableData
} from '../../Types';
import './FlaggingDashboard.scss';
import DashboardSettingsComponent from './DashboardSettingsComponent';
import DashboardCommentTable from './DashboardCommentTable';
import {calcNoiseRatio, getCurrentTimestamp, htmlDecode} from '../../Utils';
import {flagComment, getComments, getFlagQuota} from '../../SE_API';
import {blacklist, whitelist} from '../../GlobalVars';


const postTypeFilter = (configPostType: PostType, postType: PostType): boolean => {
    if (configPostType === 'all') {
        return true;
    } else {
        return configPostType === postType;
    }
};


const FlaggingDashboard = (
    {
        authStr, apiRequestRate, flagRateLimit, fkey, settings, toaster
    }: FlaggingDashboardProps
) => {
    const [tableData, setTableData] = useState<TableData>({});
    const [seenCommentIds,] = useState<Set<number>>(new Set());
    const [configurableSettings, setConfigurableSettings] = useState<ConfigurableSettings>({
        DISPLAY_CERTAINTY: settings.get('DISPLAY_CERTAINTY') as number,
        MAXIMUM_LENGTH_COMMENT: settings.get('MAXIMUM_LENGTH_COMMENT') as number,
        POST_TYPE: settings.get('POST_TYPE') as PostType,
        FILTER_WHITELIST: settings.get('FILTER_WHITELIST') as boolean
    });
    const [remainingFlagCount, setRemainingFlagCount] = useState<number | undefined>(undefined);
    const [, setPendingFlagCount] = useState<number>(0);

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
    }, [settings, setRemainingFlagCount]);

    /**
     * Handle the Flagging of the comment and update the TableData with the result
     */
    const handleFlagComment = useCallback(async (comment: Comment) => {
        // Get remaining flag amount (Need to do this before flagging because it's not accessible after the comment was deleted)
        void pullDownRemainingFlagsFromFlagDialogue(comment._id);
        // Do Flag
        try {
            const result: CommentFlagResult = await flagComment(fkey, comment._id);
            setTableData(oldTableData => {
                return {
                    ...oldTableData,
                    [comment._id]: {
                        ...oldTableData[comment._id],
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
                        [comment._id]: {
                            ...oldTableData[comment._id],
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
                        [comment._id]: {
                            ...oldTableData[comment._id],
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
                        [comment._id]: {
                            ...oldTableData[comment._id],
                            can_flag: false
                        }
                    };
                });
            }
        } finally {
            setTimeout(() => {
                setPendingFlagCount(pfc => pfc - 1);
            }, flagRateLimit); // Don't consider pending complete until after the timelimit is done
            setTableData(oldTableData => {
                return {
                    ...oldTableData,
                    [comment._id]: {
                        ...oldTableData[comment._id],
                        enqueued: false
                    }
                };
            });
        }
    }, [setTableData, toaster, pullDownRemainingFlagsFromFlagDialogue, setRemainingFlagCount]);


    /**
     * Define and start interval to pull down comments
     */
    useEffect(() => {
        // Prime last successful read
        let lastSuccessfulRead: number = Math.floor((getCurrentTimestamp() - apiRequestRate) / 1000);
        const pullDownComments = async () => {
            const toDate = Math.floor(getCurrentTimestamp() / 1000);
            const comments: APIComment[] = await getComments(
                authStr,
                lastSuccessfulRead,
                toDate
            );
            if (comments.length > 0) {
                // Update last successful read time
                lastSuccessfulRead = toDate + 1;
                const batch = new Date();
                setTableData(oldTableData => {
                    return {
                        ...oldTableData,
                        ...comments.reduce((newTableData: TableData, comment) => {
                            if (seenCommentIds.has(comment.comment_id)) {
                                if (!Object.hasOwn(oldTableData, comment.comment_id)) {
                                    return tableData;
                                }
                            } else {
                                seenCommentIds.add(comment.comment_id);
                            }

                            const decodedMarkdown = htmlDecode(comment.body_markdown) || '';
                            const blacklistMatches = decodedMarkdown.replace(/`.*`/g, '').match(blacklist) || []; // exclude code from analysis

                            const noiseRatio = calcNoiseRatio(
                                blacklistMatches,
                                decodedMarkdown.replace(/\B@\w+/g, '').length// Don't include at mentions in length of string
                            );
                            newTableData[comment.comment_id] = {
                                can_flag: comment.can_flag,
                                body: comment.body,
                                body_markdown: comment.body_markdown,
                                owner: comment.owner,
                                link: comment.link,
                                _id: comment.comment_id,
                                post_id: comment.post_id,
                                post_type: comment.post_type,
                                pulled_date: batch,
                                blacklist_matches: blacklistMatches,
                                whitelist_matches: decodedMarkdown.match(whitelist) || [],
                                noise_ratio: noiseRatio
                            };
                            return newTableData;
                        }, {} as TableData)
                    };
                });
            }
        };
        if (settings.get('RUN_IMMEDIATELY') as boolean) {
            void pullDownComments();
        }
        window.setInterval(pullDownComments, apiRequestRate);

    }, [settings]);

    /**
     * Determine if row should be rendered or not
     */
    const shouldRenderRow = useCallback((comment: Comment): boolean => {
        return postTypeFilter(configurableSettings.POST_TYPE, comment.post_type) &&
            (!configurableSettings.FILTER_WHITELIST || comment.whitelist_matches.length === 0) &&
            comment.body_markdown.length <= configurableSettings.MAXIMUM_LENGTH_COMMENT &&
            comment.noise_ratio >= configurableSettings.DISPLAY_CERTAINTY;
    }, [configurableSettings]);

    /*
    Handle removing a comment from table
     */
    const handleRemoveComment = useCallback((commentId: number) => {
        setTableData(oldTableData => {
            const newTableData = {...oldTableData};
            delete newTableData[commentId];
            return newTableData;
        });
    }, [setTableData]);

    /**
     * Update comment in table to be enqueued (creates spinner effect)
     * Also setTimeout to handle the flag
     */
    const handleEnqueueComment = useCallback((commentId: number) => {
        setTableData(oldTableData => {
            // Set Timeout to Handle Flag after time based on number of pending flags
            const c: Comment = {...oldTableData[commentId]};
            setPendingFlagCount(pfc => {
                setTimeout(() => {
                    void handleFlagComment(c);
                }, pfc * flagRateLimit);
                return pfc + 1;
            });
            // Update Table Data to show as enqueued
            return {
                ...oldTableData,
                [commentId]: {...oldTableData[commentId], enqueued: true}
            };
        });
    }, [setPendingFlagCount, setTableData]);

    /**
     * Update Page Title based on number of visible and actionable comments
     */
    useEffect(() => {
        if (settings.get('DOCUMENT_TITLE_SHOULD_UPDATE')) {
            const pending = Object.values(tableData).reduce((acc, comment) => {
                if (shouldRenderRow(comment) && comment.can_flag && !comment.was_flagged) {
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
    }, [settings, tableData]);

    return (
        <div id="nln-comment-wrapper">
            <div className="nln-header">
                <h2>NLN Comment Flagging Dashboard
                    {
                        settings.get('TOTAL_NUMBER_OF_POSTS_IN_MEMORY') &&
                        <span id="nln-comment-scan-count"
                              title="Total Number of Comments (without filters)"> ({Object.keys(tableData).length})</span>
                    }
                </h2>
            </div>
            <DashboardSettingsComponent
                settings={settings}
                configurableSettings={configurableSettings}
                setConfigurableSettings={setConfigurableSettings}/>
            <DashboardCommentTable settings={settings}
                                   tableData={tableData}
                                   shouldRenderRow={shouldRenderRow}
                                   handleEnqueueComment={handleEnqueueComment}
                                   handleRemoveComment={handleRemoveComment}
            />
            <div className="nln-footer d-flex gs8 gsx ai-center">
                <button className="s-btn s-btn__primary" onClick={ev => {
                    ev.preventDefault();
                    // Remove All Values
                    setTableData(() => {
                        return {};
                    });
                    ev.currentTarget.blur();
                }}>
                    Clear All
                </button>
                <button className="s-btn" style={{marginLeft: '5px'}} onClick={ev => {
                    ev.preventDefault();

                    setTableData(oldTableData => {
                        const newTableData: TableData = {};
                        for (const [commentId, comment] of Object.entries(oldTableData) as unknown as [number, Comment][]) {
                            if (!comment.can_flag || comment?.was_flagged || comment?.was_deleted) {
                                continue;
                            }
                            newTableData[commentId] = {...comment};
                        }
                        return newTableData;
                    });
                    ev.currentTarget.blur();
                }}>
                    Clear Handled
                </button>
                {remainingFlagCount &&
                    <div className="flex--item ml-auto fc-light"
                         id="nln-remaining-comment-flags">
                    <span title="The data is updated infrequently the number of flags may be inaccurate">
                        You have {remainingFlagCount} flags left today
                    </span>
                    </div>}
            </div>
        </div>
    );
};

export default FlaggingDashboard;