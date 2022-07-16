import {useState} from 'react';
import {Comment} from '../../Types';
import {TableData} from './DashboardTypes';


interface DashboardCommentManagementControlsProps {
    setTableData: React.Dispatch<React.SetStateAction<TableData>>;
    tableDataSize: number;
    shouldDisplayTotal: boolean;
    shouldRenderRow: (c: Comment) => boolean;
    remainingFlagCount: number | undefined;
    handleBackFillComments: undefined | ((c: number) => Promise<void>);
}

const strFmtHours = (hours: number) => {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
};

const DashboardCommentManagementControls = (
    {
        setTableData,
        tableDataSize,
        shouldDisplayTotal,
        shouldRenderRow,
        remainingFlagCount,
        handleBackFillComments
    }: DashboardCommentManagementControlsProps
): JSX.Element => {
    // const [hours, setHours] = useState<number>(1);
    const [pulling, setPulling] = useState<boolean>(false);
    const [hourPanelOpen, setHourPanelOpen] = useState<boolean>(false);

    return (
        <div className={'d-flex gs8 gsx ai-center'}>
            <button className={`s-btn s-btn__danger s-btn__filled ${shouldDisplayTotal ? 's-btn--badge' : ''}`}
                    {...shouldDisplayTotal && {
                        title: `Clear all ${tableDataSize} comment${tableDataSize === 1 ? '' : 's'} in the dashboard (excluding filters)`
                    }}
                    disabled={tableDataSize === 0}
                    onClick={ev => {
                        ev.preventDefault();
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
                        ev.currentTarget.blur();
                    }}>
                Clear All {shouldDisplayTotal && <span className={'s-btn--badge'}>
                <span className={'s-btn--number'}>{tableDataSize}</span>
            </span>}
            </button>
            <button className={'s-btn s-btn__danger ml6'}
                    title={'Remove all comments that are not currently visible'}
                    disabled={tableDataSize === 0}
                    onClick={ev => {
                        ev.preventDefault();

                        setTableData(oldTableData => {
                            const newTableData: TableData = {};
                            for (const [commentId, comment] of Object.entries(oldTableData) as unknown as [number, Comment][]) {
                                if (shouldRenderRow(comment)) {
                                    newTableData[commentId] = {...comment};
                                }
                            }
                            return newTableData;
                        });
                        ev.currentTarget.blur();
                    }}>
                Clear Hidden
            </button>
            <button className={'s-btn ml6'}
                    title={'Remove all comments have been actioned on'}
                    disabled={tableDataSize === 0}
                    onClick={ev => {
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
            {handleBackFillComments !== undefined && <div className={'flex--item'}>
                <button className={`s-btn s-btn__outlined ${pulling ? 'is-loading' : 's-btn__dropdown'} ml6`}
                        title={'Manually fetch comments from previous hours'}
                        onClick={ev => {
                            ev.preventDefault();
                            if (!pulling) {
                                setHourPanelOpen(open => !open);
                            }
                            ev.currentTarget.blur();
                        }}>
                    Pull Comments
                </button>
                <div className={`s-popover ws0 px1 py4 mt8 ${hourPanelOpen ? 'is-visible' : ''}`}>
                    <div className={'s-popover--arrow s-popover--arrow__tc'}/>
                    <ul className={'s-menu'} role={'menu'}>
                        {Array.from(
                            {length: 12}, // Only support up to 12 hours back (avoid pulling too many comments)
                            (_, i) => {
                                const v = i + 1;
                                return <li role={'menuitem'} key={v}>
                                    <button className={'s-block-link'}
                                            onClick={(ev) => {
                                                ev.preventDefault();
                                                if (!pulling) { // Don't allow double pulling
                                                    setPulling(true);
                                                    setHourPanelOpen(false); // close menu while pulling
                                                    // Pull down (convert hours to milliseconds)
                                                    handleBackFillComments(v * 60 * 60 * 1000).finally(() => {
                                                        setPulling(false);
                                                    });
                                                }
                                                ev.currentTarget.blur();
                                            }}>
                                        {strFmtHours(v)}
                                    </button>
                                </li>;
                            }
                        )}
                    </ul>
                </div>
            </div>}
            {remainingFlagCount !== undefined &&
                <div className={'flex--item ml-auto fc-light'}>
                    <span title={'The data is updated infrequently the number of flags may be inaccurate'}>
                        You have {remainingFlagCount} flags left today
                    </span>
                </div>}
        </div>
    );
};

export default DashboardCommentManagementControls;