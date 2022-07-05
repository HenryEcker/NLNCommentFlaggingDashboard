import {Comment} from '../../Types';
import {TableData} from './DashboardTypes';


const DashboardCommentManagementControls = ({setTableData, shouldRenderRow, remainingFlagCount}: {
    setTableData: React.Dispatch<React.SetStateAction<TableData>>;
    shouldRenderRow: (c: Comment) => boolean;
    remainingFlagCount: number | undefined;
}): JSX.Element => {
    return (
        <div className={'nln-comment-management-toolbar d-flex gs8 gsx ai-center'}>
            <button className={'s-btn s-btn__primary'}
                    onClick={ev => {
                        ev.preventDefault();
                        // Remove All Values
                        setTableData(() => {
                            return {};
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