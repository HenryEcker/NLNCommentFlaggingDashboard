import './Toast.scss';
import {ToastTheme} from "../../Types";
import {formatCSSDuration} from "../../Utils";

export class Toast {
    private readonly toastMountPoint: JQuery<HTMLElement>;
    private readonly openCloseDuration: number;

    constructor(id: string, openCloseDuration = 450) {
        this.toastMountPoint = $(`<div id="${id}"></div>`);
        $('body').append(this.toastMountPoint);
        this.openCloseDuration = openCloseDuration;
    }

    open(message: string, toastTheme: ToastTheme, toastDuration: number | undefined = 5000): void {
        const toastDiv = $(`<div class="nln-toast open ${toastTheme}"></div>`);
        toastDiv.css('animation-duration', formatCSSDuration(this.openCloseDuration));
        {
            const toastContent = $(` <div class="toast-content"></div></div>`);
            {
                const toastText = $(`<div class="toast-text"><span>${message}</span></div>`);
                toastContent.append(toastText);
            }
            {
                const toastCloseWrapper = $(`<div class="toast-close-wrapper"></div>`);
                const toastCloseButton = $(`<button title="close" class="toast-close-button">X</button>`);
                toastCloseButton.on('click', () => this.close(toastDiv));
                toastCloseWrapper.append(toastCloseButton);
                toastContent.append(toastCloseWrapper);
            }
            toastDiv.append(toastContent);
        }
        // Only add progress bar and autoclose if toast has duration
        if (toastDuration !== undefined) {
            const toastProgressWrapper = $(`<div class="toast-progress-wrapper"></div>`);
            const toastProgress = $(`<div class="toast-progress"></div>`);
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
        toastDiv.removeClass('open');
        toastDiv.addClass('close');
        window.setTimeout(() => {
            toastDiv.remove();
        }, this.openCloseDuration);
    }
}