import './Toast.scss';

export class Toast {
    private readonly message: string;

    constructor(message: string) {
        this.message = message;
    }

    open(): void {
        $('body').prepend($(`<div class="nln-toast"><div class="header">${this.message}</div></div>`));
    }
}