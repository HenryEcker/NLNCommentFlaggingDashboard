import {memo} from 'react';

const ClearAllButton = (
    {
        shouldDisplayTotal,
        tableDataSize,
        isDisabled,
        clearAllClickHandler
    }: {
        shouldDisplayTotal: boolean;
        tableDataSize: number;
        isDisabled: boolean;
        clearAllClickHandler: (ev: React.MouseEvent<HTMLButtonElement>) => void;
    }
) => {
    if (shouldDisplayTotal) {
        return (
            <button className={'s-btn s-btn__danger s-btn__filled s-btn--badge'}
                    title={`Clear all ${tableDataSize} comment${tableDataSize === 1 ? '' : 's'} in the dashboard (excluding filters)`}
                    disabled={isDisabled}
                    onClick={clearAllClickHandler}>
                Clear All <span className={'s-btn--badge'}>
                <span className={'s-btn--number'}>{tableDataSize}</span>
            </span>
            </button>
        );
    } else {
        return (
            <button className={'s-btn s-btn__danger s-btn__filled'}
                    disabled={isDisabled}
                    onClick={clearAllClickHandler}>
                Clear All
            </button>
        );
    }
};

export default memo(ClearAllButton, (prevProps, nextProps) => {
    if (nextProps.shouldDisplayTotal === true) {
        return prevProps.tableDataSize === nextProps.tableDataSize &&
            prevProps.clearAllClickHandler === nextProps.clearAllClickHandler &&
            prevProps.isDisabled === nextProps.isDisabled;
    } else {
        // tableDataSize does not matter if we're not displaying the total
        return prevProps.clearAllClickHandler === nextProps.clearAllClickHandler &&
            prevProps.isDisabled === nextProps.isDisabled;
    }
});