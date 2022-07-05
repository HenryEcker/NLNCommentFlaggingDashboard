import {Comment, PostType} from '../../Types';
import {SettingsUI} from '../Settings/SettingsUI';
import {Toast} from '../Toast/Toast';

export interface TableData {
    [key: number]: Comment;
}

export interface ConfigurableSettings {
    DISPLAY_CERTAINTY: number;
    MAXIMUM_LENGTH_COMMENT: number;
    POST_TYPE: PostType;
    FILTER_WHITELIST: boolean;
}

export interface FlaggingDashboardProps {
    authStr: string;
    apiRequestRate: number;
    fkey: string;
    settings: SettingsUI;
    dashboardCommentDisplaySettings: DashboardCommentTableDisplaySettings;
    toaster: Toast;
}

export interface DashboardCommentTableDisplaySettings {
    UI_DISPLAY_COMMENT_OWNER: boolean;
    UI_DISPLAY_POST_TYPE: boolean;
    UI_DISPLAY_POST_ID: boolean;
    UI_DISPLAY_LINK_TO_COMMENT: boolean;
    UI_DISPLAY_BLACKLIST_MATCHES: boolean;
    UI_DISPLAY_WHITELIST_MATCHES: boolean;
    UI_DISPLAY_NOISE_RATIO: boolean;
    UI_DISPLAY_FLAG_BUTTON: boolean;
    UI_DISPLAY_COMMENT_DELETE_STATE: boolean;
}