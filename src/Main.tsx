import FlaggingDashboard from './UI/Dashboard/FlaggingDashboard';
import {Toast} from './UI/Toast/Toast';
import {SettingsUI} from './UI/Settings/SettingsUI';
import React from 'react';
import {createRoot} from 'react-dom/client';
import {DashboardCommentTableDisplaySettings} from './UI/Dashboard/DashboardTypes';
import {StackExchangeAPI} from './Types';


declare const StackExchange: StackExchangeAPI;

function UserScript(): void {
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
                        'type': 'select',
                        'options': ['stackoverflow'],
                        'default': 'stackoverflow'
                    },
                    'ACCESS_TOKEN': {
                        'label': 'Access Token',
                        'type': 'text',
                        'attributes': {
                            'size': 25
                        }
                    },
                    'KEY': {
                        'label': 'Key',
                        'type': 'text',
                        'attributes': {
                            'size': 25
                        }
                    },
                    // 'API_QUOTA_LIMIT': {
                    //     'label': 'At what API quota should this script stop making new requests',
                    //     'type': 'number',
                    //     'default': 500,
                    //     'attributes': {
                    //         'step': 1,
                    //         'min': 0,
                    //     }
                    // },
                    'DELAY_BETWEEN_API_CALLS': {
                        'label': 'How frequently (in seconds) should comments be fetched',
                        'type': 'number',
                        'default': 180,
                        'attributes': {
                            'step': 1,
                            'min': 60, // Calls shouldn't be made more than once a minute
                        }
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
                        'default': 600,
                        'attributes': {
                            'step': 1,
                            'min': 15, // Minimum comment length
                            'max': 600, // Maximum length limit
                        }
                    },
                    'DISPLAY_CERTAINTY': {
                        'label': 'How certain should the script be to display in UI (out of 100)',
                        'type': 'number',
                        'default': 25,
                        'attributes': {
                            'min': 0,
                            'max': 100,
                            'step': 0.01
                        }
                    },
                    'FILTER_WHITELIST': {
                        'label': 'Do not display rows with any whitelist matches: ',
                        'type': 'checkbox',
                        'default': true
                    },
                },
                'UI Settings': {
                    'DOCUMENT_TITLE_SHOULD_UPDATE': {
                        'label': 'Update Title with number of pending comments for review: ',
                        'type': 'checkbox',
                        'default': true
                    },
                    'TOTAL_NUMBER_OF_POSTS_IN_MEMORY': {
                        'label': 'Display total number of comments in memory: ',
                        'type': 'checkbox',
                        'default': true
                    },
                    'UI_DISPLAY_COMMENT_OWNER': {
                        'label': 'Display display name of Comment author and enable comments-by-author modal',
                        'type': 'checkbox',
                        'default': true
                    },
                    'UI_DISPLAY_POST_TYPE': {
                        'label': 'Display Type of Post the comment is under: ',
                        'type': 'checkbox',
                        'default': true
                    },
                    'UI_DISPLAY_POST_COMMENTS': {
                        'label': 'Display ID of Post the comment is under and enable comments-on-post modal: ',
                        'type': 'checkbox',
                        'default': true
                    },
                    'UI_DISPLAY_POST_INDEX': {
                        'label': 'Show comment order and number of comments on the Post: ',
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
                    'UI_DISPLAY_WHITELIST_MATCHES': {
                        'label': 'Display Whitelist Matches: ',
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
                    'UI_DISPLAY_REMAINING_FLAGS': {
                        'label': 'Display remaining flags (updated after flagging): ',
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

    const siteName: string = settings.get('SITE_NAME') as string;
    const accessToken: string = settings.get('ACCESS_TOKEN') as string;
    const apiKey: string = settings.get('KEY') as string;
    if (!accessToken || !apiKey) {
        // Will not run without a valid API auth string
        settings.open();
        return;
    }

    // Add Settings Button
    const settingsButton: JQuery<HTMLElement> = $('<span title="NLN Comment Flagging Dashboard Settings" style="font-size:15pt;cursor: pointer;" class="s-topbar--item">⚙</span>');
    settingsButton.on('click', () => {
        settings.open();
    });
    const li: JQuery = $('<li></li>');
    li.append(settingsButton);
    $('header ol.s-topbar--content > li:nth-child(2)').after(li);

    if (settings.get('ACTIVE') as boolean) {
        const authStr = `site=${siteName}&access_token=${accessToken}&key=${apiKey}`;
        const apiRequestRate = (settings.get('DELAY_BETWEEN_API_CALLS') as number) * 1000;
        const fkey = StackExchange.options.user.fkey;

        // Create Toaster for custom Toast Messages
        const toaster = new Toast('nln-toast-container');

        // Build UI
        const container = document.createElement('div');
        container.id = 'nln-dashboard-mount-point';
        $('#mainbar').before(container);

        const dashboardCommentDisplaySettings = (
            [
                'UI_DISPLAY_COMMENT_OWNER',
                'UI_DISPLAY_POST_TYPE',
                'UI_DISPLAY_POST_COMMENTS',
                'UI_DISPLAY_LINK_TO_COMMENT',
                'UI_DISPLAY_BLACKLIST_MATCHES',
                'UI_DISPLAY_WHITELIST_MATCHES',
                'UI_DISPLAY_NOISE_RATIO',
                'UI_DISPLAY_FLAG_BUTTON',
                'UI_DISPLAY_COMMENT_DELETE_STATE',
                'UI_DISPLAY_POST_INDEX'
            ] as (keyof DashboardCommentTableDisplaySettings)[]
        ).reduce((acc, v) => {
            acc[v] = settings.get(v) as boolean;
            return acc;
        }, {} as DashboardCommentTableDisplaySettings);

        createRoot(
            container,
            {identifierPrefix: 'nln-'}
        ).render(
            <React.StrictMode>
                <FlaggingDashboard
                    authStr={authStr}
                    apiRequestRate={apiRequestRate}
                    fkey={fkey}
                    settings={settings}
                    dashboardCommentDisplaySettings={dashboardCommentDisplaySettings}
                    toaster={toaster}
                />
            </React.StrictMode>
        );
    }
}

UserScript();