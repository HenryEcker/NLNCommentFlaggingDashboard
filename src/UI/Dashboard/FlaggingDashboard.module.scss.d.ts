/* eslint-disable @typescript-eslint/consistent-type-definitions */
export type Styles = {
  'comment-wrapper': string;
  'dashboard-settings-container': string;
  'setting-elem-container': string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
