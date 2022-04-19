import {calcNoiseRatio, getOffset, htmlDecode} from "./Utils";
import {APIComment, FlaggingDashboardConfig, PostType, SECommentAPIResponse, StackExchange} from "./Types";
import {FlaggingDashboard} from "./UI/Dashboard/FlaggingDashboard";
import {getComments} from "./SE_API";
import {blacklist, whitelist} from "./GlobalVars";
import {Toast} from "./UI/Toast/Toast";
import {SettingsUI} from "./UI/Settings/SettingsUI";


declare const StackExchange: StackExchange;


function postTypeFilter(configPT: PostType, actualPT: PostType): boolean {
    if (configPT === 'all') {
        return true;
    } else {
        return configPT === actualPT;
    }
}


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
                    'API_QUOTA_LIMIT': {
                        'label': 'At what API quota should this script stop making new requests',
                        'type': 'number',
                        'default': 500,
                        'attributes': {
                            'step': 1,
                            'min': 0,
                        }
                    },
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
                    'HOUR_OFFSET': {
                        'label': 'How long ago (in hours) should the calls be offset',
                        'type': 'number',
                        'default': 0,
                        'attributes': {
                            'min': 0,
                            'step': 0.01
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

    const SITE_NAME: string = settings.get('SITE_NAME') as string;
    const ACCESS_TOKEN: string = settings.get('ACCESS_TOKEN') as string;
    const KEY: string = settings.get('KEY') as string;
    if (!ACCESS_TOKEN || !KEY) {
        // Will not run without a valid API auth string
        settings.open();
        return;
    }
    const AUTH_STR = `site=${SITE_NAME}&access_token=${ACCESS_TOKEN}&key=${KEY}`;
    const COMMENT_FILTER = '!SVaJvZISgqg34qVVD)';
    const API_REQUEST_RATE = (settings.get('DELAY_BETWEEN_API_CALLS') as number) * 1000;

    // Add Settings Button
    const settingsButton: JQuery<HTMLElement> = $('<span title="NLN Comment Flagging Dashboard Settings" style="font-size:15pt;cursor: pointer;" class="s-topbar--item">⚙</span>');
    settingsButton.on('click', () => settings.open());
    const li: JQuery = $('<li></li>')
    li.append(settingsButton);
    $('header ol.s-topbar--content > li:nth-child(2)').after(li);
    const fkey = StackExchange.options.user.fkey;

    if ((settings.get('ACTIVE') as boolean)) {
        // Prime last successful read
        let lastSuccessfulRead: number = Math.floor((getOffset(settings.get('HOUR_OFFSET') as number) - API_REQUEST_RATE) / 1000);


        // Create Toaster for custom Toast Messages
        const toaster = new Toast("NLN-Toast-Container");

        // Build UI
        const UI: FlaggingDashboard = new FlaggingDashboard(
            $('#mainbar'),
            fkey,
            {
                displayLink: settings.get('UI_DISPLAY_LINK_TO_COMMENT') as boolean,
                displayPostType: settings.get('UI_DISPLAY_POST_TYPE') as boolean,
                displayNoiseRatio: settings.get('UI_DISPLAY_NOISE_RATIO') as boolean,
                displayFlagUI: settings.get('UI_DISPLAY_FLAG_BUTTON') as boolean,
                displayBlacklistMatches: settings.get('UI_DISPLAY_BLACKLIST_MATCHES') as boolean,
                displayCommentDeleteState: settings.get('UI_DISPLAY_COMMENT_DELETE_STATE') as boolean,
                shouldUpdateTitle: settings.get('DOCUMENT_TITLE_SHOULD_UPDATE') as boolean
            } as FlaggingDashboardConfig,
            toaster
        );

        UI.init();

        const main = async (mainInterval?: number) => {
            const toDate = Math.floor(getOffset(settings.get('HOUR_OFFSET') as number) / 1000);
            const response: SECommentAPIResponse = await getComments(
                AUTH_STR,
                COMMENT_FILTER,
                lastSuccessfulRead,
                toDate
            );
            if (response.quota_remaining <= (settings.get('API_QUOTA_LIMIT') as number)) {
                toaster.open('Remaining API Threshold below limit. Stopping Script.', 'error', undefined);
                window.clearInterval(mainInterval);
                return; // Exit script
            }
            if (response.items.length > 0) {

                // Update last successful read time
                lastSuccessfulRead = toDate + 1;

                response.items.forEach((comment: APIComment) => {
                    if (
                        postTypeFilter(settings.get('POST_TYPE') as PostType, comment.post_type) &&
                        comment.body_markdown.length <= (settings.get('MAXIMUM_LENGTH_COMMENT') as number)
                    ) {
                        const decodedMarkdown = htmlDecode(comment.body_markdown) || '';
                        const blacklistMatches = decodedMarkdown.replace(/`.*`/g, '').match(blacklist); // exclude code from analysis
                        if (blacklistMatches && !decodedMarkdown.match(whitelist)) {
                            const noiseRatio = calcNoiseRatio(
                                blacklistMatches,
                                decodedMarkdown.replace(/\B@\w+/g, '').length// Don't include at mentions in length of string
                            );
                            if (noiseRatio >= (settings.get('DISPLAY_CERTAINTY') as number)) {
                                UI.addComment({
                                    can_flag: comment.can_flag,
                                    body: decodedMarkdown,
                                    link: comment.link,
                                    _id: comment.comment_id,
                                    post_id: comment.post_id,
                                    post_type: comment.post_type,
                                    blacklist_matches: blacklistMatches,
                                    noise_ratio: noiseRatio
                                });
                            }
                        }
                    }
                });
            }
        };
        if ((settings.get('RUN_IMMEDIATELY') as boolean)) {
            main();
        }
        const mainInterval = window.setInterval(() => main(mainInterval), API_REQUEST_RATE);
    }
}

UserScript();