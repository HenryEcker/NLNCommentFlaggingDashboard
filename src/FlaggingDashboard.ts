import {Comment, FlagAttemptFailed, FlaggingDashboardConfig, RatedLimitedError} from "./types";
import {capitalise, formatPercentage} from "./utils";
import {flagComment} from "./api";

export class FlaggingDashboard {
    private readonly mountPoint: JQuery;
    private readonly fkey: string;
    private readonly uiConfig: FlaggingDashboardConfig;
    private tableData: { [key: number]: Comment };
    private readonly htmlIds = {
        containerDivId: "NLN_Comment_Wrapper",
        tableId: "NLN_Comment_Reports_Table",
        tableBodyId: "NLN_Comment_Reports_Table_Body"
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

    constructor(mountPoint: JQuery, fkey: string, uiConfig: FlaggingDashboardConfig) {
        this.mountPoint = mountPoint;
        this.fkey = fkey;
        this.uiConfig = uiConfig;
        this.tableData = {};
        this.buildBaseStyles();
        this.buildBaseUI();
    }

    buildBaseStyles(): void {
        // Add Styles
        const styles = document.createElement('style');
        styles.setAttribute('id', 'nln-comment-userscript-styles')
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

    buildBaseUI(): void {
        const container = $(`<div id="${this.htmlIds.containerDivId}""></div>`);
        // Header Elements
        {
            const header = $('<nln-header></nln-header>');
            header.append($(`<h2>NLN Comments</h2>`));
            container.append(header);
        }
        // Build Table
        {
            const tableContainer = $(`<div class="${this.SO.CSS.tableContainerDiv}"></div>`);
            const table = $(`<table id="${this.htmlIds.tableId}" class="${this.SO.CSS.table}"></table>`);
            const thead = $('<thead></thead>')
            const tr = $('<tr></tr>')
            tr.append($('<th>Comment Text</th>'));
            if (this.uiConfig.displayPostType) {
                tr.append($('<th>Post Type</th>'));
            }
            if (this.uiConfig.displayLink) {
                tr.append($('<th>Link</th>'));
            }
            if (this.uiConfig.displayBlacklistMatches) {
                tr.append($('<th>Blacklist Matches</th>'));
            }
            if (this.uiConfig.displayNoiseRatio) {
                tr.append($('<th>Noise Ratio</th>'));
            }
            if (this.uiConfig.displayFlagUI) {
                tr.append($('<th>Flag</th>'));
            }
            if (this.uiConfig.displayCommentDeleteState) {
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
            const footer = $('<nln-footer></nln-footer>');
            const clearAllButton = $(`<button class="${this.SO.CSS.buttonPrimary}">Clear All</button>`);
            clearAllButton.on('click', () => {
                this.tableData = {};
                this.render();
            })
            footer.append(clearAllButton);
            container.append(footer);
        }
        this.mountPoint.before(container);
    }

    render(): void {
        const tbody = $(`#${this.htmlIds.tableBodyId}`);
        tbody.empty();
        Object.values(this.tableData).forEach(comment => {
            const tr = $('<tr></tr>');
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
                    const flagButton = $(`<button data-comment-id="${comment._id}" class="${this.SO.CSS.buttonPrimary}">Flag</button>`);
                    flagButton.on('click', () => {
                        flagButton.text('Flagging...');
                        this.handleFlagComment(this.fkey, comment)
                    });
                    const td = $('<td></td>');
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
                const clearButton = $(`<button class="${this.SO.CSS.buttonGeneral}">Clear</button>`);
                clearButton.on('click', () => this.removeComment(comment._id));
                const clearButtonTD = $('<td></td>');
                clearButtonTD.append(clearButton);
                tr.append(clearButtonTD);
            }
            tbody.prepend(tr);
        });
        this.updatePageTitle();
    }

    handleFlagComment(fkey: string, comment: Comment) {
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

    addComment(comment: Comment): void {
        this.tableData[comment._id] = comment;
        this.render();
    }

    removeComment(comment_id: number): void {
        delete this.tableData[comment_id];
        this.render();
    }

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