/* eslint-disable @typescript-eslint/consistent-type-definitions */
export type Styles = {
  'close': string;
  'error': string;
  'fadeInDown': string;
  'fadeUpOut': string;
  'open': string;
  'progressAnimate': string;
  'toast': string;
  'toast-close-button': string;
  'toast-close-wrapper': string;
  'toast-content': string;
  'toast-progress': string;
  'toast-progress-wrapper': string;
  'toast-text': string;
  'warning': string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
