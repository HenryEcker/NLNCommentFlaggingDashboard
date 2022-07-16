import {useId, useState} from 'react';
import {Comment} from '../../Types';
import {TableData} from './DashboardTypes';


interface DashboardCommentManagementControlsProps {
    setTableData: React.Dispatch<React.SetStateAction<TableData>>;
    shouldRenderRow: (c: Comment) => boolean;
    remainingFlagCount: number | undefined;
    handleBackFillComments: undefined | ((c: number) => Promise<void>);
}

const strFmtHours = (hours: number) => {
    return `${hours} hour${hours === 1 ? ' ' : 's'}`;
};

const DashboardCommentManagementControls = (
    {
        setTableData,
        shouldRenderRow,
        remainingFlagCount,
        handleBackFillComments
    }: DashboardCommentManagementControlsProps
): JSX.Element => {
    const [hours, setHours] = useState<number>(1);
    const [pulling, setPulling] = useState<boolean>(false);
    const selectId = useId();

    return (
        <div className={'d-flex gs8 gsx ai-center'}>
            <button className={'s-btn s-btn__primary'}
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
                Clear All
            </button>
            <button className={'s-btn'}
                    style={{marginLeft: '5px'}}
                    title={'Remove all comments that are not currently visible'}
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
            <button className={'s-btn'}
                    style={{marginLeft: '5px'}}
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
            {handleBackFillComments !== undefined && <>
                <div className={'s-select'}>
                    <select id={selectId}
                            onChange={ev => {
                                setHours(Number(ev.target.value));
                            }}
                            value={hours}
                    >
                        {Array.from(
                            {length: 12}, // Only support up to 12 hours back (avoid pulling too many comments)
                            (_, i) => {
                                const v = i + 1;
                                return <option key={v} value={v}>{strFmtHours(v)}</option>;
                            }
                        )}
                    </select>
                </div>
                <button className={'s-btn s-btn__primary'}
                        style={{marginLeft: '5px'}}
                        title={`Fetch the last ${strFmtHours(hours)} of Comments`}
                        onClick={ev => {
                            ev.preventDefault();
                            // Pull down (convert hours to milliseconds)
                            setPulling(true);
                            handleBackFillComments(hours * 60 * 60 * 1000).finally(() => {
                                setPulling(false);
                            });
                            ev.currentTarget.blur();
                        }}>
                    {!pulling ? 'Pull Comments' : <span style={{display: 'flex', gap: '3px'}}>
                        <div className={'s-spinner s-spinner__sm'}>
                            <div className={'v-visible-sr'}>Fetching...</div>
                        </div>
                        Pulling Comments...
                    </span>}
                </button>
            </>}
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