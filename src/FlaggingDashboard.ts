import {Comment, FlagAttemptFailed, FlaggingDashboardConfig, RatedLimitedError} from "./types";
import {capitalise, formatPercentage} from "./utils";
import {flagComment} from "./api";

export class FlaggingDashboard {
    private readonly mountPoint: JQuery<HTMLElement>;
    private readonly fkey: string;
    private readonly uiConfig: FlaggingDashboardConfig;
    private tableData: { [key: number]: Comment };
    private readonly htmlIds = {
        containerDivId: "NLN_Comment_Wrapper",
        tableId: "NLN_Comment_Reports_Table",
        tableBodyId: "NLN_Comment_Reports_Table_Body",
        styleId: "nln-comment-userscript-styles"
    };
    private readonly SO = {
        'CSS': {
            tableContainerDiv: 's-table-container',
            table: 's-table',
            buttonPrimary: 's-btn s-btn__primary',
            buttonGeneral: 's-btn',
        },
        'HTML': {
            pendingSpan: '<span class="supernovabg mod-flag-indicator">pending</span>'
        }
    };

    /**
     * Create a new Flagging Dashboard Object to display potentially flaggable comments
     *
     * @param {JQuery<HTMLElement>} mountPoint The HTMLElement in which this dashboard will be built
     * @param {string} fkey The user fkey (needed to handle flagging)
     * @param {FlaggingDashboardConfig} uiConfig Configuration to determine which UI elements to render
     */
    constructor(mountPoint: JQuery<HTMLElement>, fkey: string, uiConfig: FlaggingDashboardConfig) {
        this.mountPoint = mountPoint;
        this.fkey = fkey;
        this.uiConfig = uiConfig;
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
    buildBaseStyles(): void {
        // Add Styles
        const styles = document.createElement('style');
        styles.setAttribute('id', this.htmlIds.styleId);
        styles.innerHTML = `
#${this.htmlIds.containerDivId} {
    padding: 25px 0;
    display: grid;
    grid-template-rows: 40px 1fr 40px;
    grid-gap: 10px;
}
`;
        document.head.appendChild(styles);
    }

    /**
     * Build the UI template (header body footer)
     */
    buildBaseUI(): void {
        const container = jQuery(`<div id="${this.htmlIds.containerDivId}""></div>`);
        // Header Elements
        {
            const header = jQuery('<nln-header></nln-header>');
            header.append(jQuery(`<h2>NLN Comment Flagging Dashboard</h2>`));
            container.append(header);
        }
        // Build Table
        {
            const tableContainer = jQuery(`<div class="${this.SO.CSS.tableContainerDiv}"></div>`);
            const table = jQuery(`<table id="${this.htmlIds.tableId}" class="${this.SO.CSS.table}"></table>`);
            const thead = jQuery('<thead></thead>')
            const tr = jQuery('<tr></tr>')
            tr.append(jQuery('<th>Comment Text</th>'));
            if (this.uiConfig.displayPostType) {
                tr.append(jQuery('<th>Post Type</th>'));
            }
            if (this.uiConfig.displayLink) {
                tr.append(jQuery('<th>Link</th>'));
            }
            if (this.uiConfig.displayBlacklistMatches) {
                tr.append(jQuery('<th>Blacklist Matches</th>'));
            }
            if (this.uiConfig.displayNoiseRatio) {
                tr.append(jQuery('<th>Noise Ratio</th>'));
            }
            if (this.uiConfig.displayFlagUI) {
                tr.append(jQuery('<th>Flag</th>'));
            }
            if (this.uiConfig.displayCommentDeleteState) {
                tr.append(jQuery('<th>Deleted</th>'));
            }
            tr.append(jQuery('<th>Clear</th>'));
            thead.append(tr);
            table.append(thead);
            table.append(jQuery(`<tbody id="${this.htmlIds.tableBodyId}"></tbody>`));
            tableContainer.append(table);
            container.append(tableContainer);
        }
        // After
        {
            const footer = jQuery('<nln-footer></nln-footer>');
            const clearAllButton = jQuery(`<button class="${this.SO.CSS.buttonPrimary}">Clear All</button>`);
            clearAllButton.on('click', () => {
                this.tableData = {};
                this.render();
            })
            footer.append(clearAllButton);
            container.append(footer);
        }
        this.mountPoint.before(container);
    }

    /**
     * Render the currently available values in tableData
     */
    render(): void {
        const tbody = jQuery(`#${this.htmlIds.tableBodyId}`);
        tbody.empty();
        Object.values(this.tableData).forEach(comment => {
            const tr = jQuery('<tr></tr>');
            tr.append(`<td>${comment.body}</td>`);

            if (this.uiConfig.displayPostType) {
                tr.append(`<td>${capitalise(comment.post_type)}</td>`);
            }
            if (this.uiConfig.displayLink) {
                tr.append(`<td><a href="${comment.link}" target="_blank">${comment._id}</a></td>`);
            }
            if (this.uiConfig.displayBlacklistMatches) {
                tr.append(`<td>${comment.blacklist_matches.map(e => `"${e}"`).join(', ')}</td>`);
            }
            if (this.uiConfig.displayNoiseRatio) {
                tr.append(`<td>${formatPercentage(comment.noise_ratio)}</td>`);
            }

            if (this.uiConfig.displayFlagUI) {
                // Flag Button/Indicators
                if (!comment.can_flag) {
                    tr.append(`<td>🚫</td>`);
                } else if (comment.was_flagged) {
                    tr.append(`<td>✓</td>`);
                } else {
                    const flagButton = jQuery(`<button data-comment-id="${comment._id}" class="${this.SO.CSS.buttonPrimary}">Flag</button>`);
                    flagButton.on('click', () => {
                        flagButton.text('Flagging...');
                        this.handleFlagComment(comment)
                    });
                    const td = jQuery('<td></td>');
                    td.append(flagButton);
                    tr.append(td);
                }
            }

            if (this.uiConfig.displayCommentDeleteState) {
                if (comment.was_deleted !== undefined) {
                    if (comment.was_deleted) {
                        tr.append(`<td>✓</td>`);
                    } else {
                        tr.append(`<td>${this.SO.HTML.pendingSpan}</td>`);
                    }
                } else {
                    tr.append(`<td></td>`);
                }
            }
            // Clear Button
            {
                const clearButton = jQuery(`<button class="${this.SO.CSS.buttonGeneral}">Clear</button>`);
                clearButton.on('click', () => this.removeComment(comment._id));
                const clearButtonTD = jQuery('<td></td>');
                clearButtonTD.append(clearButton);
                tr.append(clearButtonTD);
            }
            tbody.prepend(tr);
        });
        this.updatePageTitle();
    }

    /**
     * Flags the comment and handle the response then renders
     *
     * @param comment the comment to flag
     */
    handleFlagComment(comment: Comment) {
        flagComment(this.fkey, comment).then((newComment: Comment) => {
            this.tableData[newComment._id] = newComment;
        }).catch((err) => {
            if (err instanceof RatedLimitedError) {
                alert('Flagging too fast!');
            } else if (err instanceof FlagAttemptFailed) {
                alert(err.message);
                this.tableData[comment._id].can_flag = false;
            }
        }).finally(() => {
            this.render();
        });
    }

    /**
     * Add a new comment to tableData and render
     *
     * @param comment the Comment to add
     */
    addComment(comment: Comment): void {
        this.tableData[comment._id] = comment;
        this.render();
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
    updatePageTitle(): void {
        if (this.uiConfig.shouldUpdateTitle) {
            const pending = Object.values(this.tableData).reduce((acc, comment) => {
                if (comment.can_flag && !comment.was_flagged) {
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
}