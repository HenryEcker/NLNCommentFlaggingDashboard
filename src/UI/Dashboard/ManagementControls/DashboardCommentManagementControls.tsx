import {useCallback, useMemo} from 'react';
import {Comment, StackExchangeAPI} from '../../../Types';
import {TableData} from '../DashboardTypes';
import ClearAllButton from './ClearAllButton';
import RemainingFlagCountSpan from './RemainingFlagCountSpan';
import BackFillCommentsButtonAndPopover from './BackFillCommentsButtonAndPopover';


declare const StackExchange: StackExchangeAPI;

interface DashboardCommentManagementControlsProps {
    setTableData: React.Dispatch<React.SetStateAction<TableData>>;
    tableDataSize: number;
    shouldDisplayTotal: boolean;
    shouldRenderRow: (c: Comment) => boolean;
    commentWasHandled: (c: Comment) => boolean;
    remainingFlagCount: number | undefined;
    handleBackFillComments: undefined | ((c: number) => Promise<void>);
}

const DashboardCommentManagementControls = (
    {
        setTableData,
        tableDataSize,
        shouldDisplayTotal,
        shouldRenderRow,
        commentWasHandled,
        remainingFlagCount,
        handleBackFillComments
    }: DashboardCommentManagementControlsProps
): JSX.Element => {
    const isDisabled = useMemo(() => tableDataSize === 0, [tableDataSize]);

    const clearAllClickHandler = useCallback((ev: React.MouseEvent<HTMLButtonElement>) => {
        ev.preventDefault();
        void StackExchange.helpers.showConfirmModal(
            {
                title: 'Clear All Comments From Dashboard',
                bodyHtml: '<span>Are you sure you want to remove all comments from the dashboard? (this cannot be undone)</span>',
                buttonLabel: 'Clear All',
            }
        ).then((confirm: boolean) => {
            if (confirm) {
                // Remove All Values (Enqueued values cannot be removed)
                setTableData(oldTableData => {
                    const newTableData: TableData = {};
                    for (const [commentId, comment] of Object.entries(oldTableData) as unknown as [number, Comment][]) {
                        if (comment?.enqueued === true) {
                            newTableData[commentId] = {...comment};
                        }
                    }
                    return newTableData;
                });
            }
        });
        ev.currentTarget.blur();
    }, [setTableData]);

    const clearHiddenClickHandler = useCallback((ev: React.MouseEvent<HTMLButtonElement>) => {
        ev.preventDefault();
        void StackExchange.helpers.showConfirmModal(
            {
                title: 'Clear Hidden Comments From Dashboard',
                bodyHtml: '<p>Are you sure you want to remove all currently hidden comments from the dashboard?</p><p><strong>This cannot be undone</strong> and will limit modal actions like pulling all comments on a post or by author.</p>',
                buttonLabel: 'Clear Hidden',
            }
        ).then((confirm: boolean) => {
            if (confirm) {
                setTableData(oldTableData => {
                    const newTableData: TableData = {};
                    for (const [commentId, comment] of Object.entries(oldTableData) as unknown as [number, Comment][]) {
                        if (shouldRenderRow(comment)) {
                            newTableData[commentId] = {...comment};
                        }
                    }
                    return newTableData;
                });
            }
        });
        ev.currentTarget.blur();
    }, [setTableData, shouldRenderRow]);

    return (
        <div className={'d-flex gs8 gsx ai-center'}>
            <ClearAllButton
                shouldDisplayTotal={shouldDisplayTotal}
                tableDataSize={tableDataSize}
                isDisabled={isDisabled}
                clearAllClickHandler={clearAllClickHandler}
            />
            <button className={'s-btn s-btn__danger ml6'}
                    title={'Remove all comments that are not currently visible'}
                    disabled={isDisabled}
                    onClick={clearHiddenClickHandler}>
                Clear Hidden
            </button>
            <button className={'s-btn ml6'}
                    title={'Remove all comments that have been actioned on'}
                    disabled={isDisabled}
                    onClick={ev => {
                        ev.preventDefault();

                        setTableData(oldTableData => {
                            const newTableData: TableData = {};
                            for (const [commentId, comment] of Object.entries(oldTableData) as unknown as [number, Comment][]) {
                                if (!commentWasHandled(comment)) {
                                    newTableData[commentId] = {...comment};
                                }
                            }
                            return newTableData;
                        });
                        ev.currentTarget.blur();
                    }}>
                Clear Handled
            </button>
            <BackFillCommentsButtonAndPopover handleBackFillComments={handleBackFillComments}/>
            <RemainingFlagCountSpan remainingFlagCount={remainingFlagCount}/>
        </div>
    );
};

export default DashboardCommentManagementControls;