import styles from './Toast.module.scss';
import {formatCSSDuration} from '../../Utils';

export type ToastTheme = 'error' | 'warning';

export class Toast {
    private readonly toastMountPoint: JQuery<HTMLElement>;
    private readonly openCloseDuration: number;

    constructor(id: string, openCloseDuration = 450) {
        this.toastMountPoint = $(`<div id="${id}"></div>`);
        $('body').append(this.toastMountPoint);
        this.openCloseDuration = openCloseDuration;
    }

    open(message: string, toastTheme: ToastTheme, toastDuration: number | null = 5000): void {
        const toastDiv = $(`<div class="${styles['toast']} ${styles['open']} ${styles[toastTheme]}"></div>`);
        toastDiv.css('animation-duration', formatCSSDuration(this.openCloseDuration));
        {
            const toastContent = $(`<div class="${styles['toast-content']}"></div></div>`);
            {
                const toastText = $(`<div class="${styles['toast-text']}"><span>${message}</span></div>`);
                toastContent.append(toastText);
            }
            {
                const toastCloseWrapper = $(`<div class="${styles['toast-close-wrapper']}"></div>`);
                const toastCloseButton = $(`<button title="close" class="${styles['toast-close-button']}">X</button>`);
                toastCloseButton.on('click', () => {
                    this.close(toastDiv);
                });
                toastCloseWrapper.append(toastCloseButton);
                toastContent.append(toastCloseWrapper);
            }
            toastDiv.append(toastContent);
        }
        // Only add progress bar and autoclose if toast has duration
        if (toastDuration !== null) {
            const toastProgressWrapper = $(`<div class="${styles['toast-progress-wrapper']}"></div>`);
            const toastProgress = $(`<div class="${styles['toast-progress']}"></div>`);
            toastProgress.css('animation-delay', formatCSSDuration(this.openCloseDuration));
            toastProgress.css('animation-duration', formatCSSDuration(toastDuration));
            toastProgressWrapper.append(toastProgress);
            toastDiv.append(toastProgressWrapper);
            // Automatically close toast after duration
            window.setTimeout(() => {
                this.close(toastDiv);
            }, toastDuration + this.openCloseDuration);
        }

        this.toastMountPoint.append(toastDiv);
    }

    close(toastDiv: JQuery<HTMLElement>): void {
        toastDiv.removeClass(styles['open']);
        toastDiv.addClass(styles['close']);
        window.setTimeout(() => {
            toastDiv.remove();
        }, this.openCloseDuration);
    }
}