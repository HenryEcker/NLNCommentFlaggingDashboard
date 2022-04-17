import {SettingsUI} from "./SettingsUI";

const settingMountPoint = $('<div id="nln-flagging-dashboard-settings-modal"></div>');
$('body').append(settingMountPoint);
const settings = new SettingsUI(
    settingMountPoint,
    {
        'id': 'NLN_Comment_Config',
        'title': 'NLN Comment Flagging Dashboard Settings',
        'fields': {
            'API Information': {
                'SITE_NAME': {
                    'label': 'Site Name',
                    'type': 'text',
                    'default': 'stackoverflow'
                },
                'ACCESS_TOKEN': {
                    'label': 'Access Token',
                    'type': 'text',
                    'size': 25
                },
                'KEY': {
                    'label': 'Key',
                    'type': 'text',
                    'size': 25
                },
                'API_QUOTA_LIMIT': {
                    'label': 'At what API quota should this script stop making new requests',
                    'type': 'number',
                    'step': 1,
                    'min': 0,
                    'default': 500
                },
                'DELAY_BETWEEN_API_CALLS': {
                    'label': 'How frequently (in seconds) should comments be fetched',
                    'type': 'number',
                    'step': 1,
                    'min': 60, // Calls shouldn't be made more than once a minute
                    'default': 180
                },
            },
            'Run Information': {
                'ACTIVE': {
                    'label': 'Running',
                    'type': 'checkbox',
                    'default': false
                },
                'RUN_IMMEDIATELY': {
                    'label': 'Should run immediately on entering matched pages',
                    'type': 'checkbox',
                    'default': false
                },
                'POST_TYPE': {
                    'label': 'Types of post to consider',
                    'type': 'select',
                    'options': ['all', 'question', 'answer'],
                    'default': 'all'
                },
                'MAXIMUM_LENGTH_COMMENT': {
                    'label': 'Maximum length comments to consider',
                    'type': 'number',
                    'step': 1,
                    'min': 15, // Minimum comment length
                    'max': 600, // Maximum length limit
                    'default': 600 // Default to max
                },
                'HOUR_OFFSET': {
                    'label': 'How long ago (in hours) should the calls be offset',
                    'type': 'number',
                    'min': 0,
                    'default': 0
                },
                'DISPLAY_CERTAINTY': {
                    'label': 'How certain should the script be to display in UI (out of 100)',
                    'type': 'number',
                    'min': 0,
                    'max': 100,
                    'default': 25
                },
                'FLAG_QUOTA_LIMIT': {
                    'label': 'Stop flagging with how many remaining comment flags',
                    'type': 'number',
                    'step': 1,
                    'min': 0,
                    'max': 100,
                    'default': 0
                },
            },
            'UI Settings': {
                'DOCUMENT_TITLE_SHOULD_UPDATE': {
                    'label': 'Update Title with number of pending comments for review: ',
                    'type': 'checkbox',
                    'default': true
                },
                'UI_DISPLAY_POST_TYPE': {
                    'label': 'Display Type of Post the comment is under: ',
                    'type': 'checkbox',
                    'default': true
                },
                'UI_DISPLAY_LINK_TO_COMMENT': {
                    'label': 'Display Link to Comment: ',
                    'type': 'checkbox',
                    'default': true
                },
                'UI_DISPLAY_BLACKLIST_MATCHES': {
                    'label': 'Display Blacklist Matches: ',
                    'type': 'checkbox',
                    'default': true
                },
                'UI_DISPLAY_NOISE_RATIO': {
                    'label': 'Display Noise Ratio: ',
                    'type': 'checkbox',
                    'default': true
                },
                'UI_DISPLAY_FLAG_BUTTON': {
                    'label': 'Display Flag button: ',
                    'type': 'checkbox',
                    'default': true
                },
                'UI_DISPLAY_COMMENT_DELETE_STATE': {
                    'label': 'Display If comment was deleted or not: ',
                    'type': 'checkbox',
                    'default': true
                },
            }
        }
    }
);

settings.open();