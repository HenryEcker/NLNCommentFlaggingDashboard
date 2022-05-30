import {
    AlreadyDeletedError,
    AlreadyFlaggedError,
    Comment,
    CommentFlagResult,
    FlagAttemptFailed,
    OutOfFlagsError,
    PostType,
    RatedLimitedError
} from '../../Types';
import {capitalise, formatPercentage} from '../../Utils';
import {flagComment, getFlagQuota} from '../../SE_API';
import {Toast} from '../Toast/Toast';
import {InputFieldConfig, SelectFieldConfig, SettingsUI} from '../Settings/SettingsUI';


interface TableData {
    [key: number]: Comment;
}

export class FlaggingDashboard {
    private readonly mountPoint: JQuery<HTMLElement>;
    private readonly flagsRemainingDiv: JQuery<HTMLElement>;
    private readonly fkey: string;
    private readonly settings: SettingsUI;
    private readonly toaster: Toast;
    private tableData: TableData;
    private readonly htmlIds = {
        containerDivId: 'NLN_Comment_Wrapper',
        tableId: 'NLN_Comment_Reports_Table',
        tableBodyId: 'NLN_Comment_Reports_Table_Body',
        styleId: 'nln-comment-userscript-styles',
        remainingFlags: 'NLN_Remaining_Comment_Flags',
        commentScanCount: 'nln-comment-scan-count',
        settingContainerDiv: 'nln-dashboard-settings-container',
    };
    private readonly SO = {
        'CSS': {
            tableContainerDiv: 's-table-container',
            table: 's-table',
            buttonPrimary: 's-btn s-btn__primary',
            buttonGeneral: 's-btn',
            flagsRemainingDiv: 'flex--item ml-auto fc-light',
            footer: 'd-flex gs8 gsx ai-center',
        },
        'HTML': {
            pendingSpan: '<span class="supernovabg mod-flag-indicator">pending</span>',
            spinner: (size: string, text: string) => `<div class="s-spinner s-spinner__${size}"><div class="v-visible-sr">${text}</div></div>`
        }
    };

    /**
     * Create a new Flagging Dashboard Object to display potentially flaggable comments
     *
     * @param {JQuery<HTMLElement>} mountPoint The HTMLElement in which this dashboard will be built
     * @param {string} fkey The user fkey (needed to handle flagging)
     * @param {SettingsUI} settings Configuration to determine which UI elements to render
     * @param {Toast} toaster A toaster to display custom toast messages.
     */
    constructor(mountPoint: JQuery<HTMLElement>, fkey: string, settings: SettingsUI, toaster: Toast) {
        this.mountPoint = mountPoint;
        this.flagsRemainingDiv = $(`<div class="${this.SO.CSS.flagsRemainingDiv}" id="${this.htmlIds.remainingFlags}"></div>`);
        this.fkey = fkey;
        this.settings = settings;
        this.toaster = toaster;
        this.tableData = {};
    }

    /**
     * Build the initial table (should only be called once)
     */
    init(): void {
        this.buildBaseStyles();
        this.buildBaseUI();
    }

    /**
     * Create a style element and add CSS
     */
    private buildBaseStyles(): void {
        // Add Styles
        const styles = document.createElement('style');
        styles.setAttribute('id', this.htmlIds.styleId);
        styles.innerHTML = `
#${this.htmlIds.containerDivId} {
    padding: 25px 0;
    display: grid;
    grid-template-rows: 25px min-content 1fr 40px;
    grid-gap: 10px;
}

#${this.htmlIds.settingContainerDiv} {
    display: flex;
    gap: 25px;
    flex-wrap: wrap;
    flex-direction: row;
    align-items: center;
}

.nln-setting-elem-container {
    display: flex;
    align-items: center;
    gap: 7px;
}

#${this.htmlIds.settingContainerDiv} select {
    height: min-content;
}
`;
        document.head.appendChild(styles);
    }

    /**
     * Build the UI template (header body footer)
     */
    private buildBaseUI(): void {
        const container = $(`<div id="${this.htmlIds.containerDivId}"></div>`);
        // Header Elements
        {
            const header = $('<div class="nln-header"></div>');
            header.append($(`<h2>NLN Comment Flagging Dashboard <span id="${this.htmlIds.commentScanCount}" title="Total Number of Comments (without filters)"></span></h2>`));
            container.append(header);
        }
        const settingsContainer = $('<div id="nln-dashboard-settings-container"></div>');
        container.append(settingsContainer);
        const buildSettingContainer = () => {
            {
                // Sliders
                const buildSlider = (
                    settingKey: string, textLabel: string,
                    formatSliderValue: (v: string | number) => string
                ): JQuery<HTMLElement> => {
                    const settingConfig = this.settings.getConfigProfile(settingKey) as InputFieldConfig;
                    const id = `SLIDER_${settingKey}`;

                    // Certainty Slider
                    const sliderContainer = $('<div class="nln-setting-elem-container"></div>');

                    const sliderInput = $(`<input id="${id}" type='range' min='${settingConfig.attributes?.min}' max='${settingConfig.attributes?.max}' step='${settingConfig.attributes?.step}' value='${this.settings.get(settingKey)}' class='slider'>`);
                    const sliderValue = $(`<span>${formatSliderValue(this.settings.get(settingKey) as number)}</span>`);
                    // Update Slider Value
                    sliderInput.on('input', (ev) => {
                        sliderValue.text(formatSliderValue((ev.target as HTMLInputElement).value));
                    });
                    // Update Settings on Mouse Up
                    sliderInput.on('change', (ev) => {
                        this.settings.set(settingKey, Number((ev.target as HTMLInputElement).value));
                        this.render();
                    });
                    sliderContainer.append(`<label for="${id}">${textLabel}</label>`);
                    sliderContainer.append(sliderInput);
                    sliderContainer.append(sliderValue);
                    return sliderContainer;
                };
                settingsContainer.append(
                    buildSlider(
                        'DISPLAY_CERTAINTY',
                        'Display Certainty',
                        (v) => `${Number(v).toFixed(2)}%`
                    )
                );
                settingsContainer.append(
                    buildSlider(
                        'MAXIMUM_LENGTH_COMMENT',
                        'Maximum Length',
                        (v) => `${Number(v).toFixed(0)}`
                    )
                );
            }
            {
                // Select Dropdown
                const buildSelect = (
                    settingKey: string, textLabel: string
                ): JQuery<HTMLElement> => {
                    const settingConfig = this.settings.getConfigProfile(settingKey) as SelectFieldConfig;
                    const id = `SELECT_${settingKey}`;
                    const selectContainer = $('<div class="nln-setting-elem-container"></div>');

                    const select = $(`<select id="${id}"></select>`);
                    settingConfig.options.forEach((op) => {
                        select.append($(`<option value="${op}">${op}</option>`));
                    });
                    const val = this.settings.get(settingKey);
                    if (val !== undefined) {
                        select.val(val.toString());
                    }
                    select.on('change', (ev) => {
                        this.settings.set(settingKey, (ev.target as HTMLSelectElement).value);
                        this.render();
                    });

                    selectContainer.append(`<label for="${id}">${textLabel}</label>`);
                    selectContainer.append(select);
                    return selectContainer;
                };

                settingsContainer.append(
                    buildSelect('POST_TYPE', 'Post Type')
                );
            }
            {
                const buildCheckbox = (settingKey: string, textLabel: string): JQuery<HTMLElement> => {
                    const checkboxContainer = $('<div class="nln-setting-elem-container"></div>');
                    const id = `CHECKBOX_${settingKey}`;
                    const checkbox = $(`<input id='${id}' type="checkbox" checked="${this.settings.get(settingKey)}"/>`);

                    checkbox.on('change', (ev) => {
                        this.settings.set(settingKey, Boolean((ev.target as HTMLInputElement).checked));
                        this.render();
                    });

                    checkboxContainer.append(`<label for="${id}">${textLabel}</label>`);
                    checkboxContainer.append(checkbox);
                    return checkboxContainer;
                };
                settingsContainer.append(
                    buildCheckbox('FILTER_WHITELIST', 'Filter Whitelist')
                );
            }
            {
                const resetSettingsDisplayButton = $(`<button style="margin-left: auto" class="${this.SO.CSS.buttonGeneral}">Reset</button>`);
                resetSettingsDisplayButton.on('click', (ev) => {
                    ev.preventDefault();
                    this.settings.reload();
                    settingsContainer.empty();
                    buildSettingContainer();
                    this.render();
                });
                settingsContainer.append(resetSettingsDisplayButton);
            }
            {
                const saveSettingsButton = $(`<button class="${this.SO.CSS.buttonGeneral}">Save</button>`);
                saveSettingsButton.on('click', (ev) => {
                    ev.preventDefault();
                    this.settings.save();
                    saveSettingsButton.blur();
                });
                settingsContainer.append(saveSettingsButton);
            }
        };
        buildSettingContainer();
        // Build Table
        {
            const tableContainer = $(`<div class="${this.SO.CSS.tableContainerDiv}"></div>`);
            const table = $(`<table id="${this.htmlIds.tableId}" class="${this.SO.CSS.table}"></table>`);
            const thead = $('<thead></thead>');
            const tr = $('<tr></tr>');
            tr.append($('<th>Comment Text</th>'));
            if (this.settings.get('UI_DISPLAY_COMMENT_OWNER')) {
                tr.append($('<th>Author</th>'));
            }
            if (this.settings.get('UI_DISPLAY_POST_TYPE')) {
                tr.append($('<th>Post Type</th>'));
            }
            if (this.settings.get('UI_DISPLAY_LINK_TO_COMMENT')) {
                tr.append($('<th>Link</th>'));
            }
            if (this.settings.get('UI_DISPLAY_BLACKLIST_MATCHES')) {
                tr.append($('<th>Blacklist Matches</th>'));
            }
            if (this.settings.get('UI_DISPLAY_WHITELIST_MATCHES')) {
                tr.append($('<th>Whitelist Matches</th>'));
            }
            if (this.settings.get('UI_DISPLAY_NOISE_RATIO')) {
                tr.append($('<th>Noise Ratio</th>'));
            }
            if (this.settings.get('UI_DISPLAY_FLAG_BUTTON')) {
                tr.append($('<th>Flag</th>'));
            }
            if (this.settings.get('UI_DISPLAY_COMMENT_DELETE_STATE')) {
                tr.append($('<th>Deleted</th>'));
            }
            tr.append($('<th>Clear</th>'));
            thead.append(tr);
            table.append(thead);
            table.append($(`<tbody id="${this.htmlIds.tableBodyId}"></tbody>`));
            tableContainer.append(table);
            container.append(tableContainer);
        }
        // After
        {
            const footer = $(`<div class="nln-footer ${this.SO.CSS.footer}"></div>`);
            {
                const clearAllButton = $(`<button class="${this.SO.CSS.buttonPrimary}">Clear All</button>`);
                clearAllButton.on('click', () => {
                    this.tableData = {};
                    clearAllButton.blur();
                    this.render();
                });
                footer.append(clearAllButton);

                const clearHandledButton = $(`<button class="${this.SO.CSS.buttonGeneral}" style="margin-left: 5px">Clear Handled</button>`);
                clearHandledButton.on('click', () => {
                    this.tableData = (
                        Object.entries(this.tableData) as unknown as [[number, Comment]]
                    ).reduce((acc, [key, comment]) => {
                        // Preserve only those comments not already handled
                        if (comment.can_flag && !comment?.was_flagged && !comment?.was_deleted) {
                            acc[key] = comment;
                        }
                        return acc;
                    }, {} as TableData);
                    clearHandledButton.blur();
                    this.render();
                });
                footer.append(clearHandledButton);
            }
            {
                footer.append(this.flagsRemainingDiv);
            }
            container.append(footer);
        }
        this.mountPoint.before(container);
        this.updateNumberOfComments();
    }

    private static postTypeFilter(configPT: PostType, actualPT: PostType): boolean {
        if (configPT === 'all') {
            return true;
        } else {
            return configPT === actualPT;
        }
    }

    private shouldRenderRow(comment: Comment): boolean {
        return FlaggingDashboard.postTypeFilter(this.settings.get('POST_TYPE') as PostType, comment.post_type) &&
            (!(this.settings.get('FILTER_WHITELIST') as boolean) || comment.whitelist_matches.length === 0) &&
            comment.body_markdown.length <= (this.settings.get('MAXIMUM_LENGTH_COMMENT') as number) &&
            comment.noise_ratio >= this.settings.get('DISPLAY_CERTAINTY');
    }

    /**
     * Render the currently available values in tableData
     */
    private render(): void {
        const tbody = $(`#${this.htmlIds.tableBodyId}`);
        tbody.empty();
        Object.values(this.tableData).forEach((comment: Comment) => {
            if (this.shouldRenderRow(comment)) {
                const tr = $('<tr></tr>');
                tr.append(`<td>${comment.body}</td>`);
                if (this.settings.get('UI_DISPLAY_COMMENT_OWNER')) {
                    tr.append(`<td><a href="${comment.owner.link}" target="_blank">${comment.owner.display_name}</a></td>`);
                }
                if (this.settings.get('UI_DISPLAY_POST_TYPE')) {
                    tr.append(`<td>${capitalise(comment.post_type)}</td>`);
                }
                if (this.settings.get('UI_DISPLAY_LINK_TO_COMMENT')) {
                    tr.append(`<td><a href="${comment.link}" target="_blank">${comment._id}</a></td>`);
                }
                if (this.settings.get('UI_DISPLAY_BLACKLIST_MATCHES')) {
                    tr.append(`<td>${comment.blacklist_matches.map((e: string) => `"${e}"`).join(', ')}</td>`);
                }
                if (this.settings.get('UI_DISPLAY_WHITELIST_MATCHES')) {
                    tr.append(`<td>${comment.whitelist_matches.map((e: string) => `"${e}"`).join(', ')}</td>`);
                }
                if (this.settings.get('UI_DISPLAY_NOISE_RATIO')) {
                    tr.append(`<td>${formatPercentage(comment.noise_ratio)}</td>`);
                }

                if (this.settings.get('UI_DISPLAY_FLAG_BUTTON')) {
                    // Flag Button/Indicators
                    if (!comment.can_flag) {
                        tr.append('<td>🚫</td>');
                    } else if (comment.was_flagged) {
                        tr.append('<td>✓</td>');
                    } else {
                        const flagButton = $(`<button data-comment-id="${comment._id}" class="${this.SO.CSS.buttonPrimary}">Flag</button>`);
                        flagButton.on('click', () => {
                            flagButton.text('');
                            const spinner = $(this.SO.HTML.spinner('sm', 'Flagging...'));
                            flagButton.append(spinner);
                            void this.handleFlagComment(comment);
                        });
                        const td = $('<td></td>');
                        td.append(flagButton);
                        tr.append(td);
                    }
                }

                if (this.settings.get('UI_DISPLAY_COMMENT_DELETE_STATE')) {
                    if (comment.was_deleted !== undefined) {
                        if (comment.was_deleted) {
                            tr.append('<td>✓</td>');
                        } else {
                            tr.append(`<td>${this.SO.HTML.pendingSpan}</td>`);
                        }
                    } else {
                        tr.append('<td></td>');
                    }
                }
                // Clear Button
                {
                    const clearButton = $(`<button class="${this.SO.CSS.buttonGeneral}">Clear</button>`);
                    clearButton.on('click', () => {
                        this.removeComment(comment._id);
                    });
                    const clearButtonTd = $('<td></td>');
                    clearButtonTd.append(clearButton);
                    tr.append(clearButtonTd);
                }
                tbody.append(tr);
            }
        });
        this.updatePageTitle();
        this.updateNumberOfComments();
    }

    /**
     * Flags the comment and handle the response then renders
     *
     * @param comment the comment to flag
     */
    private async handleFlagComment(comment: Comment) {
        // Get remaining flag amount (Need to do this before flagging because it's not accessible after the comment was deleted)
        const remainingFlags = await this.updateRemainingFlags(comment._id);
        // Do Flag
        try {
            const result: CommentFlagResult = await flagComment(this.fkey, comment._id);
            this.tableData[comment._id].was_flagged = result.was_flagged;
            this.tableData[comment._id].was_deleted = result.was_deleted;
            // Only becomes a number if uiConfig.displayRemainingFlags is true
            if (remainingFlags !== undefined) {
                this.setRemainingFlagDisplay(remainingFlags - 1); // A Flag was consumed
            }
        } catch (err) {
            if (err instanceof RatedLimitedError) {
                this.toaster.open('Flagging too fast!', 'error');
            } else if (err instanceof AlreadyFlaggedError) {
                this.toaster.open(err.message, 'warning', 1000);
                this.tableData[comment._id].was_flagged = true;
                this.tableData[comment._id].was_deleted = false;
            } else if (err instanceof AlreadyDeletedError) {
                this.toaster.open(err.message, 'error', 1000);
                this.tableData[comment._id].can_flag = false;
                this.tableData[comment._id].was_deleted = true;
            } else if (err instanceof OutOfFlagsError || err instanceof FlagAttemptFailed) {
                this.toaster.open(err.message, 'error', 8000);
                this.tableData[comment._id].can_flag = false;
            }
        } finally {
            this.render();
        }
    }

    /**
     * bulk add new comments to tableData and render
     *
     * @param {Comment[]} comments the array of comments to add
     */
    addComments(comments: Comment[]): void {
        if (comments.length > 0) {
            // Update remaining flags once per batch add
            void this.updateRemainingFlags(comments[0]._id);
            // Add all comments to table
            comments.forEach(comment => {
                this.tableData[comment._id] = comment;
            });
            // Re-render
            this.render();
        }
    }

    /**
     * Update the counter which tracks how many comments have been scanned
     *
     */
    updateNumberOfComments(): void {
        if (this.settings.get('TOTAL_NUMBER_OF_POSTS_IN_MEMORY')) {
            $(`#${this.htmlIds.commentScanCount}`).text(`(${Object.keys(this.tableData).length})`);
        }
    }

    /**
     * Remove comment from tableData and render
     *
     * @param comment_id the id of the comment to remove from tableData
     */
    removeComment(comment_id: number): void {
        delete this.tableData[comment_id];
        this.render();
    }

    /**
     * Adds (# pending comments) to the start of the tab title
     * Only if the config is set
     */
    private updatePageTitle(): void {
        if (this.settings.get('DOCUMENT_TITLE_SHOULD_UPDATE')) {
            const pending = Object.values(this.tableData).reduce((acc, comment) => {
                if (this.shouldRenderRow(comment) && comment.can_flag && !comment.was_flagged) {
                    return acc + 1;
                } else {
                    return acc;
                }
            }, 0);


            let title = document.title.replace(/^\(\d+\)\s+/, '');
            if (pending > 0) {
                title = `(${pending}) ${title}`;
            }
            document.title = title;
        }
    }

    private setRemainingFlagDisplay(flagsRemaining: number): void {
        this.flagsRemainingDiv.html(`<span title="The data is updated infrequently the number of flags may be inaccurate">You have ${flagsRemaining} flags left today</span>`);
    }

    private async updateRemainingFlags(commentID: number): Promise<number | undefined> {
        if (this.settings.get('UI_DISPLAY_REMAINING_FLAGS')) {
            try {
                const flagsRemaining = await getFlagQuota(commentID);
                this.setRemainingFlagDisplay(flagsRemaining);
                return flagsRemaining;
            } catch (err) {
                // Pass (It doesn't really matter whether the flag count is updated or not)
                return undefined;
            }
        }
        return undefined;
    }
}