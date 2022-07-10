/* eslint-disable @typescript-eslint/consistent-type-definitions */
export type Styles = {
  'modal-body': string;
  'modal-close-button': string;
  'modal-content': string;
  'modal-dashboard-wrapper': string;
  'modal-header': string;
  'modal-header-text': string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
