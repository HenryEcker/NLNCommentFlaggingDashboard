import {memo} from 'react';

const RemainingFlagCountSpan = (
    {
        remainingFlagCount
    }: {
        remainingFlagCount: number | undefined;
    }
) => {
    if (remainingFlagCount === undefined) {
        return null;
    } else {
        return (
            <div className={'flex--item ml-auto fc-light'}>
                    <span title={'The data is updated infrequently the number of flags may be inaccurate'}>
                        You have {remainingFlagCount} flags left today
                    </span>
            </div>
        );
    }
};

export default memo(RemainingFlagCountSpan);