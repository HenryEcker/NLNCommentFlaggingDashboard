import {calcNoiseRatio, getCurrentTimestamp, htmlDecode} from './Utils';
import {APIComment, Comment, SECommentAPIResponse, StackExchange} from './Types';
import {FlaggingDashboard} from './UI/Dashboard/FlaggingDashboard';
import {getComments} from './SE_API';
import {blacklist, whitelist} from './GlobalVars';
import {Toast} from './UI/Toast/Toast';
import {SettingsUI} from './UI/Settings/SettingsUI';


declare const StackExchange: StackExchange;


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
                        'label': 'Display User Name of Comment Author',
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
        const apiCommentFilter = '!TQs**ij.viKR)b8Sie*Qd';
        const apiRequestRate = (settings.get('DELAY_BETWEEN_API_CALLS') as number) * 1000;
        const fkey = StackExchange.options.user.fkey;
        // Prime last successful read
        let lastSuccessfulRead: number = Math.floor((getCurrentTimestamp() - apiRequestRate) / 1000);


        // Create Toaster for custom Toast Messages
        const toaster = new Toast('NLN-Toast-Container');

        // Build UI
        const ui: FlaggingDashboard = new FlaggingDashboard(
            $('#mainbar'),
            fkey,
            settings,
            toaster
        );

        ui.init();

        const main = async (mainInterval?: number) => {
            const toDate = Math.floor(getCurrentTimestamp() / 1000);
            const response: SECommentAPIResponse = await getComments(
                authStr,
                apiCommentFilter,
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
                ui.addComments(
                    response.items.reduce((acc: Comment[], comment: APIComment) => {
                        const decodedMarkdown = htmlDecode(comment.body_markdown) || '';
                        const blacklistMatches = decodedMarkdown.replace(/`.*`/g, '').match(blacklist) || []; // exclude code from analysis

                        const noiseRatio = calcNoiseRatio(
                            blacklistMatches,
                            decodedMarkdown.replace(/\B@\w+/g, '').length// Don't include at mentions in length of string
                        );
                        acc.push({
                            can_flag: comment.can_flag,
                            body: comment.body,
                            body_markdown: comment.body_markdown,
                            owner: comment.owner,
                            link: comment.link,
                            _id: comment.comment_id,
                            post_id: comment.post_id,
                            post_type: comment.post_type,
                            blacklist_matches: blacklistMatches,
                            whitelist_matches: decodedMarkdown.match(whitelist) || [],
                            noise_ratio: noiseRatio
                        });
                        return acc;
                    }, [])
                );
            }
        };
        if (settings.get('RUN_IMMEDIATELY') as boolean) {
            void main();
        }
        const mainInterval = window.setInterval(() => main(mainInterval), apiRequestRate);
    }
}

UserScript();