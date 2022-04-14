import {calcNoiseRatio, getOffset, htmlDecode} from "./Utils";
import {APIComment, FlaggingDashboardConfig, PostType, SECommentAPIResponse, StackExchange} from "./Types";
import {FlaggingDashboard} from "./UI/Dashboard/FlaggingDashboard";
import {getComments} from "./SE_API";
import {blacklist, whitelist} from "./GlobalVars";
import GM_config from '../GM_config/index';


declare const StackExchange: StackExchange;

/* Configurable Options */
GM_config.init({
    'id': 'NLN_Comment_Config',
    'title': 'NLN Comment Flagging Dashboard Settings',
    'fields': {
        'SITE_NAME': {
            'label': 'Site Name',
            'section': ['API Information (Changes will take affect on page refresh)'],
            'type': 'text',
            'default': 'stackoverflow'
        },
        'ACCESS_TOKEN': {
            'label': 'Access Token',
            'type': 'text'
        },
        'KEY': {
            'label': 'Key',
            'type': 'text'
        },
        'API_QUOTA_LIMIT': {
            'label': 'At what API quota should this script stop making new requests',
            'type': 'int',
            'default': 500
        },
        'DELAY_BETWEEN_API_CALLS': {
            'label': 'How frequently (in seconds) should comments be fetched',
            'type': 'unsigned float',
            'min': 60, // Calls shouldn't be made more than once a minute
            'default': 180
        },
        'ACTIVE': {
            'label': 'Running',
            'section': ['Run Information'],
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
            'type': 'int',
            'min': 15, // Minimum comment length
            'max': 600, // Maximum length limit
            'default': 600 // Default to max
        },
        'HOUR_OFFSET': {
            'label': 'How long ago (in hours) should the calls be offset',
            'type': 'unsigned float',
            'min': 0,
            'default': 0
        },
        'DISPLAY_CERTAINTY': {
            'label': 'How certain should the script be to display in UI (out of 100)',
            'type': 'unsigned float',
            'min': 0,
            'max': 100,
            'default': 25
        },
        'FLAG_QUOTA_LIMIT': {
            'label': 'Stop flagging with how many remaining comment flags',
            'type': 'int',
            'min': 0,
            'max': 100,
            'default': 0
        },
        'DOCUMENT_TITLE_SHOULD_UPDATE': {
            'label': 'Update Title with number of pending comments for review: ',
            'section': ['UI Settings (Changes will take affect on page refresh)'],
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
});

function postTypeFilter(actualPT: PostType): boolean {
    const configPT: PostType = GM_config.get('POST_TYPE') as PostType;
    if (configPT === 'all') {
        return true;
    } else {
        return configPT === actualPT;
    }
}


function UserScript(): void {
    const SITE_NAME: string = GM_config.get('SITE_NAME') as string;
    const ACCESS_TOKEN: string = GM_config.get('ACCESS_TOKEN') as string;
    const KEY: string = GM_config.get('KEY') as string;
    if (!SITE_NAME || !ACCESS_TOKEN || !KEY) {
        // Will not run without a valid API auth string
        GM_config.open();
    }
    const AUTH_STR = `site=${SITE_NAME}&access_token=${ACCESS_TOKEN}&key=${KEY}`;
    const COMMENT_FILTER = '!SVaJvZISgqg34qVVD)';
    const API_REQUEST_RATE = (GM_config.get('DELAY_BETWEEN_API_CALLS') as number) * 1000;

    // Add Settings Button
    const settingsButton: JQuery = $('<span title="NLN Comment Flagging Dashboard Settings" style="font-size:15pt;cursor: pointer;" class="s-topbar--item">⚙</span>');
    settingsButton.on('click', () => GM_config.open());
    const li: JQuery = $('<li></li>')
    li.append(settingsButton);
    $('header ol.s-topbar--content > li:nth-child(2)').after(li);


    const fkey = StackExchange.options.user.fkey;

    // Prime last successful read
    let lastSuccessfulRead: number = Math.floor((getOffset(GM_config.get('HOUR_OFFSET') as number) - API_REQUEST_RATE) / 1000);

    // Build UI
    const UI: FlaggingDashboard = new FlaggingDashboard(
        $('#mainbar'),
        fkey,
        {
            displayLink: GM_config.get('UI_DISPLAY_LINK_TO_COMMENT') as boolean,
            displayPostType: GM_config.get('UI_DISPLAY_POST_TYPE') as boolean,
            displayNoiseRatio: GM_config.get('UI_DISPLAY_NOISE_RATIO') as boolean,
            displayFlagUI: GM_config.get('UI_DISPLAY_FLAG_BUTTON') as boolean,
            displayBlacklistMatches: GM_config.get('UI_DISPLAY_BLACKLIST_MATCHES') as boolean,
            displayCommentDeleteState: GM_config.get('UI_DISPLAY_COMMENT_DELETE_STATE') as boolean,
            shouldUpdateTitle: GM_config.get('DOCUMENT_TITLE_SHOULD_UPDATE') as boolean
        } as FlaggingDashboardConfig
    );

    UI.init();
    // Only Render if Active
    if (GM_config.get('ACTIVE')) {
        UI.render();
    }

    const main = async (mainInterval?: number) => {
        const toDate = Math.floor(getOffset(GM_config.get('HOUR_OFFSET') as number) / 1000);
        const response: SECommentAPIResponse = await getComments(
            AUTH_STR,
            COMMENT_FILTER,
            lastSuccessfulRead,
            toDate
        );
        if (response.quota_remaining <= GM_config.get('API_QUOTA_LIMIT')) {
            window.clearInterval(mainInterval);
            return; // Exit script
        }
        if (response.items.length > 0) {

            // Update last successful read time
            lastSuccessfulRead = toDate + 1;

            response.items.forEach((comment: APIComment) => {
                if (postTypeFilter(comment.post_type) && comment.body_markdown.length <= GM_config.get('MAXIMUM_LENGTH_COMMENT')) {
                    const decodedMarkdown = htmlDecode(comment.body_markdown) || '';
                    const blacklistMatches = decodedMarkdown.replace(/`.*`/g, '').match(blacklist); // exclude code from analysis
                    if (blacklistMatches && !decodedMarkdown.match(whitelist)) {
                        const noiseRatio = calcNoiseRatio(
                            blacklistMatches,
                            decodedMarkdown.replace(/\B@\w+/g, '').length// Don't include at mentions in length of string
                        );
                        if (noiseRatio >= (GM_config.get('DISPLAY_CERTAINTY') as number)) {
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
    if ((GM_config.get('ACTIVE') as boolean)) {
        if ((GM_config.get('RUN_IMMEDIATELY') as boolean)) {
            main();
        }
        const mainInterval = window.setInterval(() => main(mainInterval), API_REQUEST_RATE);
    }
}

UserScript();