import {memo, useId, useState} from 'react';


const strFmtHours = (hours: number) => {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
};

const BackFillCommentsButtonAndPopover = (
    {
        handleBackFillComments
    }: {
        handleBackFillComments: undefined | ((c: number) => Promise<void>);
    }
) => {
    const [pulling, setPulling] = useState<boolean>(false);
    const popOverId = useId();

    if (handleBackFillComments === undefined) {
        return null;
    } else {
        return (
            <div className={'flex--item'}>
                <button
                    className={`s-btn s-btn__muted s-btn__outlined ${pulling ? 'is-loading' : 's-btn__dropdown'} ml6`}
                    role={'button'}
                    title={'Manually fetch comments from previous hours'}
                    // Only support opening popover when not pulling data
                    {...!pulling && {
                        'aria-controls': popOverId,
                        'data-controller': 's-popover',
                        'data-action': 's-popover#toggle',
                        'data-s-popover-placement': 'bottom-start',
                        'data-s-popover-toggle-class': 'is-selected'
                    }}>
                    Pull Comments
                </button>
                <div id={popOverId} className={'s-popover ws0 px1 py4'}>
                    <div className={'s-popover--arrow s-popover--arrow__tc'}/>
                    <ul className={'s-menu'} role={'menu'}>
                        {Array.from(
                            {length: 12}, // Only support up to 12 hours back (avoid pulling too many comments)
                            (_, i) => {
                                const v = i + 1;
                                return <li role={'menuitem'} key={v}>
                                    <button className={'s-block-link'}
                                            role={'button'}
                                            aria-controls={popOverId}
                                            data-controller={'s-popover'}
                                            data-action={'s-popover#toggle'} // Supports Close on click
                                            onClick={(ev) => {
                                                ev.preventDefault();
                                                if (!pulling) { // Don't allow double pulling
                                                    setPulling(true);
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
            </div>
        );
    }
};

export default memo(BackFillCommentsButtonAndPopover);