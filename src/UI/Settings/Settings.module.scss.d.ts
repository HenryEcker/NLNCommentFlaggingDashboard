export interface Styles {
    'config-buttons': string;
    'config-close-button': string;
    'config-header': string;
    'config-modal': string;
    'config-modal-background': string;
    'field-row': string;
    'header-text': string;
}

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
