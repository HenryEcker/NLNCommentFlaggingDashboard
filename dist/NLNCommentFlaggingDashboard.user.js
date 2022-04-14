// ==UserScript==
// @name         NLN Comment Flagging Dashboard
// @description  Find comments which may potentially be no longer needed and flag them for removal
// @homepage     https://github.com/HenryEcker/NLNCommentFlaggingDashboard
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      2.1.0
// @downloadURL  https://github.com/HenryEcker/NLNCommentFlaggingDashboard/raw/master/dist/NLNCommentFlaggingDashboard.user.js
// @updateURL    https://github.com/HenryEcker/NLNCommentFlaggingDashboard/raw/master/dist/NLNCommentFlaggingDashboard.user.js
//
// @include      *://stackoverflow.com/users/flag-summary/15497888?group=4*
//
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-end
//
// ==/UserScript==
/* globals $, StackExchange, $ */

/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "calcNoiseRatio": () => (/* binding */ calcNoiseRatio),
/* harmony export */   "capitalise": () => (/* binding */ capitalise),
/* harmony export */   "formatCSSDuration": () => (/* binding */ formatCSSDuration),
/* harmony export */   "formatComment": () => (/* binding */ formatComment),
/* harmony export */   "formatPercentage": () => (/* binding */ formatPercentage),
/* harmony export */   "getFormDataFromObject": () => (/* binding */ getFormDataFromObject),
/* harmony export */   "getOffset": () => (/* binding */ getOffset),
/* harmony export */   "getURLSearchParamsFromObject": () => (/* binding */ getURLSearchParamsFromObject),
/* harmony export */   "htmlDecode": () => (/* binding */ htmlDecode),
/* harmony export */   "mergeRegexes": () => (/* binding */ mergeRegexes)
/* harmony export */ });
function mergeRegexes(arrRegex, flags) {
    return new RegExp(arrRegex.map(p => p.source).join('|'), flags);
}
function capitalise(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function htmlDecode(str) {
    return new DOMParser().parseFromString(str, "text/html").documentElement.textContent;
}
function formatPercentage(percent, precision = 2) {
    return `${percent.toFixed(precision)}%`;
}
function calcNoiseRatio(matches, totalLength) {
    const lengthWeight = matches.reduce((total, match) => {
        return total + match.length;
    }, 0);
    return lengthWeight / totalLength * 100;
}
function getOffset(hours) {
    return new Date().getTime() - (hours * 60 * 60 * 1000);
}
function formatComment(comment) {
    return `${formatPercentage(comment.noise_ratio)} [${comment.blacklist_matches.join(',')}] (${comment.link})`;
}
function formatCSSDuration(ms) {
    return `${ms / 1000}s`;
}
function reduceObjectToSettableType(obj, initialAcc) {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        acc.set(key, value);
        return acc;
    }, initialAcc);
}
function getFormDataFromObject(o) {
    return reduceObjectToSettableType(o, new FormData());
}
function getURLSearchParamsFromObject(o) {
    return reduceObjectToSettableType(o, new URLSearchParams());
}


/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FlaggingDashboard": () => (/* binding */ FlaggingDashboard)
/* harmony export */ });
/* harmony import */ var _Types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3);
/* harmony import */ var _Utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1);
/* harmony import */ var _SE_API__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(4);



class FlaggingDashboard {
    constructor(mountPoint, fkey, uiConfig, toaster) {
        this.htmlIds = {
            containerDivId: "NLN_Comment_Wrapper",
            tableId: "NLN_Comment_Reports_Table",
            tableBodyId: "NLN_Comment_Reports_Table_Body",
            styleId: "nln-comment-userscript-styles"
        };
        this.SO = {
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
        this.mountPoint = mountPoint;
        this.fkey = fkey;
        this.uiConfig = uiConfig;
        this.toaster = toaster;
        this.tableData = {};
    }
    init() {
        this.buildBaseStyles();
        this.buildBaseUI();
    }
    buildBaseStyles() {
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
    buildBaseUI() {
        const container = $(`<div id="${this.htmlIds.containerDivId}""></div>`);
        {
            const header = $('<nln-header></nln-header>');
            header.append($(`<h2>NLN Comment Flagging Dashboard</h2>`));
            container.append(header);
        }
        {
            const tableContainer = $(`<div class="${this.SO.CSS.tableContainerDiv}"></div>`);
            const table = $(`<table id="${this.htmlIds.tableId}" class="${this.SO.CSS.table}"></table>`);
            const thead = $('<thead></thead>');
            const tr = $('<tr></tr>');
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
        {
            const footer = $('<nln-footer></nln-footer>');
            const clearAllButton = $(`<button class="${this.SO.CSS.buttonPrimary}">Clear All</button>`);
            clearAllButton.on('click', () => {
                this.tableData = {};
                this.render();
            });
            footer.append(clearAllButton);
            container.append(footer);
        }
        this.mountPoint.before(container);
    }
    render() {
        const tbody = $(`#${this.htmlIds.tableBodyId}`);
        tbody.empty();
        Object.values(this.tableData).forEach(comment => {
            const tr = $('<tr></tr>');
            tr.append(`<td>${comment.body}</td>`);
            if (this.uiConfig.displayPostType) {
                tr.append(`<td>${(0,_Utils__WEBPACK_IMPORTED_MODULE_1__.capitalise)(comment.post_type)}</td>`);
            }
            if (this.uiConfig.displayLink) {
                tr.append(`<td><a href="${comment.link}" target="_blank">${comment._id}</a></td>`);
            }
            if (this.uiConfig.displayBlacklistMatches) {
                tr.append(`<td>${comment.blacklist_matches.map(e => `"${e}"`).join(', ')}</td>`);
            }
            if (this.uiConfig.displayNoiseRatio) {
                tr.append(`<td>${(0,_Utils__WEBPACK_IMPORTED_MODULE_1__.formatPercentage)(comment.noise_ratio)}</td>`);
            }
            if (this.uiConfig.displayFlagUI) {
                if (!comment.can_flag) {
                    tr.append(`<td>🚫</td>`);
                }
                else if (comment.was_flagged) {
                    tr.append(`<td>✓</td>`);
                }
                else {
                    const flagButton = $(`<button data-comment-id="${comment._id}" class="${this.SO.CSS.buttonPrimary}">Flag</button>`);
                    flagButton.on('click', () => {
                        flagButton.text('Flagging...');
                        this.handleFlagComment(comment);
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
                    }
                    else {
                        tr.append(`<td>${this.SO.HTML.pendingSpan}</td>`);
                    }
                }
                else {
                    tr.append(`<td></td>`);
                }
            }
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
    handleFlagComment(comment) {
        (0,_SE_API__WEBPACK_IMPORTED_MODULE_2__.flagComment)(this.fkey, comment).then((newComment) => {
            this.tableData[newComment._id] = newComment;
        }).catch((err) => {
            if (err instanceof _Types__WEBPACK_IMPORTED_MODULE_0__.RatedLimitedError) {
                this.toaster.open('Flagging too fast!', 'error');
            }
            else if (err instanceof _Types__WEBPACK_IMPORTED_MODULE_0__.FlagAttemptFailed) {
                this.toaster.open(err.message, 'error', 8000);
                this.tableData[comment._id].can_flag = false;
            }
        }).finally(() => {
            this.render();
        });
    }
    addComment(comment) {
        this.tableData[comment._id] = comment;
        this.render();
    }
    removeComment(comment_id) {
        delete this.tableData[comment_id];
        this.render();
    }
    updatePageTitle() {
        if (this.uiConfig.shouldUpdateTitle) {
            const pending = Object.values(this.tableData).reduce((acc, comment) => {
                if (comment.can_flag && !comment.was_flagged) {
                    return acc + 1;
                }
                else {
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


/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FlagAttemptFailed": () => (/* binding */ FlagAttemptFailed),
/* harmony export */   "RatedLimitedError": () => (/* binding */ RatedLimitedError)
/* harmony export */ });
class SelfNamedError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
class FlagAttemptFailed extends SelfNamedError {
}
class RatedLimitedError extends SelfNamedError {
}


/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "flagComment": () => (/* binding */ flagComment),
/* harmony export */   "getComments": () => (/* binding */ getComments),
/* harmony export */   "getFlagQuota": () => (/* binding */ getFlagQuota)
/* harmony export */ });
/* harmony import */ var _Utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var _Types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(3);


function getComments(AUTH_STR, COMMENT_FILTER, FROM_DATE, TO_DATE = undefined) {
    const usp = (0,_Utils__WEBPACK_IMPORTED_MODULE_0__.getURLSearchParamsFromObject)({
        'pagesize': 100,
        'order': 'desc',
        'sort': 'creation',
        'filter': COMMENT_FILTER,
        'fromdate': FROM_DATE,
        ...(TO_DATE && { 'todate': TO_DATE })
    });
    return fetch(`https://api.stackexchange.com/2.3/comments?${usp.toString()}&${AUTH_STR}`)
        .then(res => res.json())
        .then(resData => resData);
}
function getFlagQuota(commentID) {
    return new Promise((resolve, reject) => {
        $.get(`https://${location.hostname}/flags/comments/${commentID}/popup`)
            .done((data) => {
            const pattern = /you have (\d+) flags left today/i;
            const match = $('div:contains("flags left today")', data).filter((idx, n) => (n.childElementCount === 0) && Boolean(n.innerText.match(pattern))).last().text().match(pattern);
            if (match !== null) {
                return resolve(Number(match[1]));
            }
            else {
                return resolve(0);
            }
        })
            .fail((err) => {
            if (err.status === 409) {
                throw new _Types__WEBPACK_IMPORTED_MODULE_1__.RatedLimitedError("You may only load the comment flag dialog every 3 seconds");
            }
            else {
                return reject();
            }
        });
    });
}
function flagComment(fkey, comment) {
    return fetch(`https://${location.hostname}/flags/comments/${comment._id}/add/39`, {
        method: "POST",
        body: (0,_Utils__WEBPACK_IMPORTED_MODULE_0__.getFormDataFromObject)({
            'fkey': fkey,
            'otherText': "",
            'overrideWarning': true
        })
    }).then((res) => {
        if (res.status === 409) {
            throw new _Types__WEBPACK_IMPORTED_MODULE_1__.RatedLimitedError("You can only flag once every 5 seconds");
        }
        else if (res.status === 200) {
            return res.json();
        }
    }).then((resData) => {
        if (resData.Success && resData.Outcome === 0) {
            comment.was_flagged = true;
            comment.was_deleted = resData.ResultChangedState;
        }
        else if (!resData.Success && resData.Outcome === 2) {
            if (resData.Message === "You have already flagged this comment") {
                comment.was_flagged = true;
                comment.was_deleted = false;
            }
            else if (resData.Message === "This comment is deleted and cannot be flagged") {
                comment.can_flag = false;
                comment.was_flagged = false;
                comment.was_deleted = true;
            }
            else if (resData.Message.toLowerCase().includes('out of flag')) {
                comment.can_flag = false;
                comment.was_flagged = false;
            }
            else {
                throw new _Types__WEBPACK_IMPORTED_MODULE_1__.FlagAttemptFailed(resData.Message);
            }
        }
        return comment;
    });
}


/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FlagAttemptFailed": () => (/* binding */ FlagAttemptFailed),
/* harmony export */   "RatedLimitedError": () => (/* binding */ RatedLimitedError),
/* harmony export */   "blacklist": () => (/* binding */ blacklist),
/* harmony export */   "whitelist": () => (/* binding */ whitelist)
/* harmony export */ });
/* harmony import */ var _Utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);

const blacklist = (0,_Utils__WEBPACK_IMPORTED_MODULE_0__.mergeRegexes)([
    /(?:[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/,
    /\s+((?=[!-~])[\W_]){2,}\s*/,
    /\b(?:t(?:y(?:sm|vm)?|hx)|ily(?:sm)?|k)\b/,
    /(?:happy|glad)\s*(?:\w+\s+)*?(he(?:ar|lp))/,
    /(?:you(r|['’]?re|\s+are)?|that['’]?s?)\s+(?:a(?:\s+rock\s+star|mazing|wesome)|incredible|brilliant|wonderful|rock|perfect)[.!]?/,
    /(?:Any\s+help\s+would\s+be\s+(?:a(?:ppreciated|wesome)|wonderful|great))/,
    /((?:\w+\s+)*?(?:looking\s*for)|that['’]?s?\s*it)[.!]?/,
    /(?:happy\s+coding)/,
    /(it('?s)?|this)\s*((re)?solved?|fix(ed)?)\s*(((m[ey]|the)\s*(issue|problem))|it)/,
    /\b(?:f(?:riend(?:io|o)?|am)|b(?:ud(?:dy)?|ro)|ma(?:te|n)|amigo|homie|dude|pal|sir)\b/,
    /(?:(?:big\s+|many\s+)?th?ank(?:s|\s*you|\s*u)?(?:\s+a lot|\s+(?:very|so) much|\s+a mil+ion|\s+)?(?:\s*for (?:your|the)?(?:\s+help)?)?|th?anx|thx|cheers)/,
    /(?:this\s+|that\s+|it\s+)?(?:solution\s+)?work(?:ed|s)?\s*(?:now|perfectly|great|for me|like a charm)?/,
    /(?:(?:you(?:'?re?|\s+are)\s+)?welcome)+/,
    /(?:(?:I\s+)?(?:hope\s+)?(?:your\s+|(?:this\s+|that\s+|it\s+)(?:was\s+|is\s+)?)?(?:very\s+)?help(?:ful|ed|s)|useful(?:\s+a lot|\s+(?:very|so) much)?)+/,
    /(?:perfect|wonderful|brilliant|Excellent|Marvelous|awesome|(?:You\s+)?saved\s+m[ey])/,
    /(?:You(?:'re|\s*are)\s+)?a\s+life\s+saver/,
    /(?:please(?:\s+\w+)*\s+)?accept(?:ed|ing)?\b(?:\s+the\s+answer)?/,
    /(?:please(?:\s+\w+)\s+)?(?:give an?\s+)?upvot(?:ed?|ing)(?:\s+the answer)?/,
], 'gi');
const whitelist = (0,_Utils__WEBPACK_IMPORTED_MODULE_0__.mergeRegexes)([
    /\b(?:n(?:eed|ot)|unfortunate(ly)?|persists?|require|but|unaccept(ed)?)\b/,
    /(?:d(?:o(?:esn(?:'t?|’t?|t)|n(?:'t?|’t?|t))|idn(?:'t?|’t?|t))|c(?:ouldn(?:'t?|’t?|t)|an(?:'t?|’t?|t))|ha(?:ven(?:'t?|’t?|t)|sn(?:'t?|’t?|t))|a(?:ren(?:'t?|’t?|t)|in(?:'t?|’t?|t))|shouldn(?:'t?|’t?|t)|wouldn(?:'t?|’t?|t)|isn(?:'t?|’t?|t))/,
    /\b(will|I'?ll)\s*try\b/,
    /[?]/
], 'gi');
class SelfNamedError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
class FlagAttemptFailed extends SelfNamedError {
}
class RatedLimitedError extends SelfNamedError {
}


/***/ }),
/* 6 */
/***/ ((module) => {

/*
Copyright 2009+, GM_config Contributors (https://github.com/sizzlemctwizzle/GM_config)

GM_config Collaborators/Contributors:
    Mike Medley <medleymind@gmail.com>
    Joe Simmons
    Izzy Soft
    Marti Martz
    Adam Thompson-Sharpe

GM_config is distributed under the terms of the GNU Lesser General Public License.

    GM_config is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// The GM_config constructor
function GM_configStruct() {
    // call init() if settings were passed to constructor
    if (arguments.length) {
        GM_configInit(this, arguments);
        this.onInit();
    }
}

// This is the initializer function
function GM_configInit(config, args) {
    // Initialize instance variables
    if (typeof config.fields == "undefined") {
        config.fields = {};
        config.onInit = config.onInit || function () {
        };
        config.onOpen = config.onOpen || function () {
        };
        config.onSave = config.onSave || function () {
        };
        config.onClose = config.onClose || function () {
        };
        config.onReset = config.onReset || function () {
        };
        config.isOpen = false;
        config.title = 'User Script Settings';
        config.css = {
            basic: [
                "#GM_config * { font-family: arial,tahoma,myriad pro,sans-serif; }",
                "#GM_config { background: #FFF; }",
                "#GM_config input[type='radio'] { margin-right: 8px; }",
                "#GM_config .indent40 { margin-left: 40%; }",
                "#GM_config .field_label { font-size: 12px; font-weight: bold; margin-right: 6px; }",
                "#GM_config .radio_label { font-size: 12px; }",
                "#GM_config .block { display: block; }",
                "#GM_config .saveclose_buttons { margin: 16px 10px 10px; padding: 2px 12px; }",
                "#GM_config .reset, #GM_config .reset a," +
                " #GM_config_buttons_holder { color: #000; text-align: right; }",
                "#GM_config .config_header { font-size: 20pt; margin: 0; }",
                "#GM_config .config_desc, #GM_config .section_desc, #GM_config .reset { font-size: 9pt; }",
                "#GM_config .center { text-align: center; }",
                "#GM_config .section_header_holder { margin-top: 8px; }",
                "#GM_config .config_var { margin: 0 0 4px; }",
                "#GM_config .section_header { background: #414141; border: 1px solid #000; color: #FFF;",
                " font-size: 13pt; margin: 0; }",
                "#GM_config .section_desc { background: #EFEFEF; border: 1px solid #CCC; color: #575757;" +
                " font-size: 9pt; margin: 0 0 6px; }"
            ].join('\n') + '\n',
            basicPrefix: "GM_config",
            stylish: ""
        };
    }

    if (args.length == 1 &&
        typeof args[0].id == "string" &&
        typeof args[0].appendChild != "function") var settings = args[0];
    else {
        // Provide backwards-compatibility with argument style intialization
        var settings = {};

        // loop through GM_config.init() arguments
        for (var i = 0, l = args.length, arg; i < l; ++i) {
            arg = args[i];

            // An element to use as the config window
            if (typeof arg.appendChild == "function") {
                settings.frame = arg;
                continue;
            }

            switch (typeof arg) {
                case 'object':
                    for (var j in arg) { // could be a callback functions or settings object
                        if (typeof arg[j] != "function") { // we are in the settings object
                            settings.fields = arg; // store settings object
                            break; // leave the loop
                        } // otherwise it must be a callback function
                        if (!settings.events) settings.events = {};
                        settings.events[j] = arg[j];
                    }
                    break;
                case 'function': // passing a bare function is set to open callback
                    settings.events = {onOpen: arg};
                    break;
                case 'string': // could be custom CSS or the title string
                    if (/\w+\s*\{\s*\w+\s*:\s*\w+[\s|\S]*\}/.test(arg))
                        settings.css = arg;
                    else
                        settings.title = arg;
                    break;
            }
        }
    }

    /* Initialize everything using the new settings object */
    // Set the id
    if (settings.id) config.id = settings.id;
    else if (typeof config.id == "undefined") config.id = 'GM_config';

    // Set the title
    if (settings.title) config.title = settings.title;

    // Set the custom css
    if (settings.css) config.css.stylish = settings.css;

    // Set the frame
    if (settings.frame) config.frame = settings.frame;

    // Set the event callbacks
    if (settings.events) {
        var events = settings.events;
        for (var e in events)
            config["on" + e.charAt(0).toUpperCase() + e.slice(1)] = events[e];
    }

    // Create the fields
    if (settings.fields) {
        var stored = config.read(), // read the stored settings
            fields = settings.fields,
            customTypes = settings.types || {},
            configId = config.id;

        for (var id in fields) {
            var field = fields[id];

            // for each field definition create a field object
            if (field)
                config.fields[id] = new GM_configField(field, stored[id], id,
                    customTypes[field.type], configId);
            else if (config.fields[id]) delete config.fields[id];
        }
    }

    // If the id has changed we must modify the default style
    if (config.id != config.css.basicPrefix) {
        config.css.basic = config.css.basic.replace(
            new RegExp('#' + config.css.basicPrefix, 'gm'), '#' + config.id);
        config.css.basicPrefix = config.id;
    }
}

GM_configStruct.prototype = {
    // Support old method of initalizing
    init: function () {
        GM_configInit(this, arguments);
        this.onInit();
    },

    // call GM_config.open() from your script to open the menu
    open: function () {
        // Die if the menu is already open on this page
        // You can have multiple instances but you can't open the same instance twice
        var match = document.getElementById(this.id);
        if (match && (match.tagName == "IFRAME" || match.childNodes.length > 0)) return;

        // Sometimes "this" gets overwritten so create an alias
        var config = this;

        // Function to build the mighty config window :)
        function buildConfigWin(body, head) {
            var create = config.create,
                fields = config.fields,
                configId = config.id,
                bodyWrapper = create('div', {id: configId + '_wrapper'});

            // Append the style which is our default style plus the user style
            head.appendChild(
                create('style', {
                    type: 'text/css',
                    textContent: config.css.basic + config.css.stylish
                }));

            // Add header and title
            bodyWrapper.appendChild(create('div', {
                id: configId + '_header',
                className: 'config_header block center'
            }, config.title));

            // Append elements
            var section = bodyWrapper,
                secNum = 0; // Section count

            // loop through fields
            for (var id in fields) {
                var field = fields[id],
                    settings = field.settings;

                if (settings.section) { // the start of a new section
                    section = bodyWrapper.appendChild(create('div', {
                        className: 'section_header_holder',
                        id: configId + '_section_' + secNum
                    }));

                    if (Object.prototype.toString.call(settings.section) !== '[object Array]')
                        settings.section = [settings.section];

                    if (settings.section[0])
                        section.appendChild(create('div', {
                            className: 'section_header center',
                            id: configId + '_section_header_' + secNum
                        }, settings.section[0]));

                    if (settings.section[1])
                        section.appendChild(create('p', {
                            className: 'section_desc center',
                            id: configId + '_section_desc_' + secNum
                        }, settings.section[1]));
                    ++secNum;
                }

                // Create field elements and append to current section
                section.appendChild((field.wrapper = field.toNode()));
            }

            // Add save and close buttons
            bodyWrapper.appendChild(create('div',
                {id: configId + '_buttons_holder'},

                create('button', {
                    id: configId + '_saveBtn',
                    textContent: 'Save',
                    title: 'Save settings',
                    className: 'saveclose_buttons',
                    onclick: function () {
                        config.save()
                    }
                }),

                create('button', {
                    id: configId + '_closeBtn',
                    textContent: 'Close',
                    title: 'Close window',
                    className: 'saveclose_buttons',
                    onclick: function () {
                        config.close()
                    }
                }),

                create('div',
                    {className: 'reset_holder block'},

                    // Reset link
                    create('a', {
                        id: configId + '_resetLink',
                        textContent: 'Reset to defaults',
                        href: '#',
                        title: 'Reset fields to default values',
                        className: 'reset',
                        onclick: function (e) {
                            e.preventDefault();
                            config.reset()
                        }
                    })
                )));

            body.appendChild(bodyWrapper); // Paint everything to window at once
            config.center(); // Show and center iframe
            window.addEventListener('resize', config.center, false); // Center frame on resize

            // Call the open() callback function
            config.onOpen(config.frame.contentDocument || config.frame.ownerDocument,
                config.frame.contentWindow || window,
                config.frame);

            // Close frame on window close
            window.addEventListener('beforeunload', function () {
                config.close();
            }, false);

            // Now that everything is loaded, make it visible
            config.frame.style.display = "block";
            config.isOpen = true;
        }

        // Change this in the onOpen callback using this.frame.setAttribute('style', '')
        var defaultStyle = 'bottom: auto; border: 1px solid #000; display: none; height: 75%;'
            + ' left: 0; margin: 0; max-height: 95%; max-width: 95%; opacity: 0;'
            + ' overflow: auto; padding: 0; position: fixed; right: auto; top: 0;'
            + ' width: 75%; z-index: 9999;';

        // Either use the element passed to init() or create an iframe
        if (this.frame) {
            this.frame.id = this.id; // Allows for prefixing styles with the config id
            this.frame.setAttribute('style', defaultStyle);
            buildConfigWin(this.frame, this.frame.ownerDocument.getElementsByTagName('head')[0]);
        } else {
            // Create frame
            document.body.appendChild((this.frame = this.create('iframe', {
                id: this.id,
                style: defaultStyle
            })));

            // In WebKit src can't be set until it is added to the page
            this.frame.src = 'about:blank';
            // we wait for the iframe to load before we can modify it
            var that = this;
            this.frame.addEventListener('load', function (e) {
                var frame = config.frame;
                if (frame.src && !frame.contentDocument) {
                    // Some agents need this as an empty string for newer context implementations
                    frame.src = "";
                } else if (!frame.contentDocument) {
                    that.log("GM_config failed to initialize default settings dialog node!");
                }
                var body = frame.contentDocument.getElementsByTagName('body')[0];
                body.id = config.id; // Allows for prefixing styles with the config id
                buildConfigWin(body, frame.contentDocument.getElementsByTagName('head')[0]);
            }, false);
        }
    },

    save: function () {
        var forgotten = this.write();
        this.onSave(forgotten); // Call the save() callback function
    },

    close: function () {
        // If frame is an iframe then remove it
        if (this.frame.contentDocument) {
            this.remove(this.frame);
            this.frame = null;
        } else { // else wipe its content
            this.frame.innerHTML = "";
            this.frame.style.display = "none";
        }

        // Null out all the fields so we don't leak memory
        var fields = this.fields;
        for (var id in fields) {
            var field = fields[id];
            field.wrapper = null;
            field.node = null;
        }

        this.onClose(); //  Call the close() callback function
        this.isOpen = false;
    },

    set: function (name, val) {
        this.fields[name].value = val;

        if (this.fields[name].node) {
            this.fields[name].reload();
        }
    },

    get: function (name, getLive) {
        var field = this.fields[name],
            fieldVal = null;

        if (getLive && field.node) {
            fieldVal = field.toValue();
        }

        return fieldVal != null ? fieldVal : field.value;
    },

    write: function (store, obj) {
        if (!obj) {
            var values = {},
                forgotten = {},
                fields = this.fields;

            for (var id in fields) {
                var field = fields[id];
                var value = field.toValue();

                if (field.save) {
                    if (value != null) {
                        values[id] = value;
                        field.value = value;
                    } else
                        values[id] = field.value;
                } else
                    forgotten[id] = value;
            }
        }
        try {
            this.setValue(store || this.id, this.stringify(obj || values));
        } catch (e) {
            this.log("GM_config failed to save settings!");
        }

        return forgotten;
    },

    read: function (store) {
        try {
            var rval = this.parser(this.getValue(store || this.id, '{}'));
        } catch (e) {
            this.log("GM_config failed to read saved settings!");
            var rval = {};
        }
        return rval;
    },

    reset: function () {
        var fields = this.fields;

        // Reset all the fields
        for (var id in fields) fields[id].reset();

        this.onReset(); // Call the reset() callback function
    },

    create: function () {
        switch (arguments.length) {
            case 1:
                var A = document.createTextNode(arguments[0]);
                break;
            default:
                var A = document.createElement(arguments[0]),
                    B = arguments[1];
                for (var b in B) {
                    if (b.indexOf("on") == 0)
                        A.addEventListener(b.substring(2), B[b], false);
                    else if (",style,accesskey,id,name,src,href,which,for".indexOf("," +
                        b.toLowerCase()) != -1)
                        A.setAttribute(b, B[b]);
                    else
                        A[b] = B[b];
                }
                if (typeof arguments[2] == "string")
                    A.innerHTML = arguments[2];
                else
                    for (var i = 2, len = arguments.length; i < len; ++i)
                        A.appendChild(arguments[i]);
        }
        return A;
    },

    center: function () {
        var node = this.frame;
        if (!node) return;
        var style = node.style,
            beforeOpacity = style.opacity;
        if (style.display == 'none') style.opacity = '0';
        style.display = '';
        style.top = Math.floor((window.innerHeight / 2) - (node.offsetHeight / 2)) + 'px';
        style.left = Math.floor((window.innerWidth / 2) - (node.offsetWidth / 2)) + 'px';
        style.opacity = '1';
    },

    remove: function (el) {
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }
};

// Define a bunch of API stuff
(function () {
    var isGM = typeof GM_getValue != 'undefined' &&
            typeof GM_getValue('a', 'b') != 'undefined',
        setValue, getValue, stringify, parser;

    // Define value storing and reading API
    if (!isGM) {
        setValue = function (name, value) {
            return localStorage.setItem(name, value);
        };
        getValue = function (name, def) {
            var s = localStorage.getItem(name);
            return s == null ? def : s
        };

        // We only support JSON parser outside GM
        stringify = JSON.stringify;
        parser = JSON.parse;
    } else {
        setValue = GM_setValue;
        getValue = GM_getValue;
        stringify = typeof JSON == "undefined" ?
            function (obj) {
                return obj.toSource();
            } : JSON.stringify;
        parser = typeof JSON == "undefined" ?
            function (jsonData) {
                return (new Function('return ' + jsonData + ';'))();
            } : JSON.parse;
    }

    GM_configStruct.prototype.isGM = isGM;
    GM_configStruct.prototype.setValue = setValue;
    GM_configStruct.prototype.getValue = getValue;
    GM_configStruct.prototype.stringify = stringify;
    GM_configStruct.prototype.parser = parser;
    GM_configStruct.prototype.log = window.console ?
        console.log : (isGM && typeof GM_log != 'undefined' ?
            GM_log : (window.opera ?
                    opera.postError : function () { /* no logging */
                    }
            ));
})();

function GM_configDefaultValue(type, options) {
    var value;

    if (type.indexOf('unsigned ') == 0)
        type = type.substring(9);

    switch (type) {
        case 'radio':
        case 'select':
            value = options[0];
            break;
        case 'checkbox':
            value = false;
            break;
        case 'int':
        case 'integer':
        case 'float':
        case 'number':
            value = 0;
            break;
        default:
            value = '';
    }

    return value;
}

function GM_configField(settings, stored, id, customType, configId) {
    // Store the field's settings
    this.settings = settings;
    this.id = id;
    this.configId = configId;
    this.node = null;
    this.wrapper = null;
    this.save = typeof settings.save == "undefined" ? true : settings.save;

    // Buttons are static and don't have a stored value
    if (settings.type == "button") this.save = false;

    // if a default value wasn't passed through init() then
    //   if the type is custom use its default value
    //   else use default value for type
    // else use the default value passed through init()
    this['default'] = typeof settings['default'] == "undefined" ?
        customType ?
            customType['default']
            : GM_configDefaultValue(settings.type, settings.options)
        : settings['default'];

    // Store the field's value
    this.value = typeof stored == "undefined" ? this['default'] : stored;

    // Setup methods for a custom type
    if (customType) {
        this.toNode = customType.toNode;
        this.toValue = customType.toValue;
        this.reset = customType.reset;
    }
}

GM_configField.prototype = {
    create: GM_configStruct.prototype.create,

    toNode: function () {
        var field = this.settings,
            value = this.value,
            options = field.options,
            type = field.type,
            id = this.id,
            configId = this.configId,
            labelPos = field.labelPos,
            create = this.create;

        function addLabel(pos, labelEl, parentNode, beforeEl) {
            if (!beforeEl) beforeEl = parentNode.firstChild;
            switch (pos) {
                case 'right':
                case 'below':
                    if (pos == 'below')
                        parentNode.appendChild(create('br', {}));
                    parentNode.appendChild(labelEl);
                    break;
                default:
                    if (pos == 'above')
                        parentNode.insertBefore(create('br', {}), beforeEl);
                    parentNode.insertBefore(labelEl, beforeEl);
            }
        }

        var retNode = create('div', {
                className: 'config_var',
                id: configId + '_' + id + '_var',
                title: field.title || ''
            }),
            firstProp;

        // Retrieve the first prop
        for (var i in field) {
            firstProp = i;
            break;
        }

        var label = field.label && type != "button" ?
            create('label', {
                id: configId + '_' + id + '_field_label',
                for: configId + '_field_' + id,
                className: 'field_label'
            }, field.label) : null;

        switch (type) {
            case 'textarea':
                retNode.appendChild((this.node = create('textarea', {
                    innerHTML: value,
                    id: configId + '_field_' + id,
                    className: 'block',
                    cols: (field.cols ? field.cols : 20),
                    rows: (field.rows ? field.rows : 2)
                })));
                break;
            case 'radio':
                var wrap = create('div', {
                    id: configId + '_field_' + id
                });
                this.node = wrap;

                for (var i = 0, len = options.length; i < len; ++i) {
                    var radLabel = create('label', {
                        className: 'radio_label'
                    }, options[i]);

                    var rad = wrap.appendChild(create('input', {
                        value: options[i],
                        type: 'radio',
                        name: id,
                        checked: options[i] == value
                    }));

                    var radLabelPos = labelPos &&
                    (labelPos == 'left' || labelPos == 'right') ?
                        labelPos : firstProp == 'options' ? 'left' : 'right';

                    addLabel(radLabelPos, radLabel, wrap, rad);
                }

                retNode.appendChild(wrap);
                break;
            case 'select':
                var wrap = create('select', {
                    id: configId + '_field_' + id
                });
                this.node = wrap;

                for (var i = 0, len = options.length; i < len; ++i) {
                    var option = options[i];
                    wrap.appendChild(create('option', {
                        value: option,
                        selected: option == value
                    }, option));
                }

                retNode.appendChild(wrap);
                break;
            default: // fields using input elements
                var props = {
                    id: configId + '_field_' + id,
                    type: type,
                    value: type == 'button' ? field.label : value
                };

                switch (type) {
                    case 'checkbox':
                        props.checked = value;
                        break;
                    case 'button':
                        props.size = field.size ? field.size : 25;
                        if (field.script) field.click = field.script;
                        if (field.click) props.onclick = field.click;
                        break;
                    case 'hidden':
                        break;
                    default:
                        // type = text, int, or float
                        props.type = 'text';
                        props.size = field.size ? field.size : 25;
                }

                retNode.appendChild((this.node = create('input', props)));
        }

        if (label) {
            // If the label is passed first, insert it before the field
            // else insert it after
            if (!labelPos)
                labelPos = firstProp == "label" || type == "radio" ?
                    "left" : "right";

            addLabel(labelPos, label, retNode);
        }

        return retNode;
    },

    toValue: function () {
        var node = this.node,
            field = this.settings,
            type = field.type,
            unsigned = false,
            rval = null;

        if (!node) return rval;

        if (type.indexOf('unsigned ') == 0) {
            type = type.substring(9);
            unsigned = true;
        }

        switch (type) {
            case 'checkbox':
                rval = node.checked;
                break;
            case 'select':
                rval = node[node.selectedIndex].value;
                break;
            case 'radio':
                var radios = node.getElementsByTagName('input');
                for (var i = 0, len = radios.length; i < len; ++i)
                    if (radios[i].checked)
                        rval = radios[i].value;
                break;
            case 'button':
                break;
            case 'int':
            case 'integer':
            case 'float':
            case 'number':
                var num = Number(node.value);
                var warn = 'Field labeled "' + field.label + '" expects a' +
                    (unsigned ? ' positive ' : 'n ') + 'integer value';

                if (isNaN(num) || (type.substr(0, 3) == 'int' &&
                        Math.ceil(num) != Math.floor(num)) ||
                    (unsigned && num < 0)) {
                    alert(warn + '.');
                    return null;
                }

                if (!this._checkNumberRange(num, warn))
                    return null;
                rval = num;
                break;
            default:
                rval = node.value;
                break;
        }

        return rval; // value read successfully
    },

    reset: function () {
        var node = this.node,
            field = this.settings,
            type = field.type;

        if (!node) return;

        switch (type) {
            case 'checkbox':
                node.checked = this['default'];
                break;
            case 'select':
                for (var i = 0, len = node.options.length; i < len; ++i)
                    if (node.options[i].textContent == this['default'])
                        node.selectedIndex = i;
                break;
            case 'radio':
                var radios = node.getElementsByTagName('input');
                for (var i = 0, len = radios.length; i < len; ++i)
                    if (radios[i].value == this['default'])
                        radios[i].checked = true;
                break;
            case 'button' :
                break;
            default:
                node.value = this['default'];
                break;
        }
    },

    remove: function (el) {
        GM_configStruct.prototype.remove(el || this.wrapper);
        this.wrapper = null;
        this.node = null;
    },

    reload: function () {
        var wrapper = this.wrapper;
        if (wrapper) {
            var fieldParent = wrapper.parentNode;
            fieldParent.insertBefore((this.wrapper = this.toNode()), wrapper);
            this.remove(wrapper);
        }
    },

    _checkNumberRange: function (num, warn) {
        var field = this.settings;
        if (typeof field.min == "number" && num < field.min) {
            alert(warn + ' greater than or equal to ' + field.min + '.');
            return null;
        }

        if (typeof field.max == "number" && num > field.max) {
            alert(warn + ' less than or equal to ' + field.max + '.');
            return null;
        }
        return true;
    }
};

// Create default instance of GM_config
const GM_config = new GM_configStruct()
module.exports = GM_config;

/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Toast": () => (/* binding */ Toast)
/* harmony export */ });
/* harmony import */ var _Toast_scss__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1);


class Toast {
    constructor(id, openCloseDuration = 450) {
        this.toastMountPoint = $(`<div id="${id}"></div>`);
        $('body').append(this.toastMountPoint);
        this.openCloseDuration = openCloseDuration;
    }
    open(message, toastType, toastDuration = 5000) {
        const toastDiv = $(`<div class="nln-toast open ${toastType}"></div>`);
        toastDiv.css('animation-duration', (0,_Utils__WEBPACK_IMPORTED_MODULE_1__.formatCSSDuration)(this.openCloseDuration));
        {
            const toastContent = $(` <div class="toast-content"></div></div>`);
            {
                const toastText = $(`<div class="toast-text"><span>${message}</span></div>`);
                toastContent.append(toastText);
            }
            {
                const toastCloseWrapper = $(`<div class="toast-close-wrapper"></div>`);
                const toastCloseButton = $(`<button title="close" class="toast-close-button">X</button>`);
                toastCloseButton.on('click', () => this.close(toastDiv));
                toastCloseWrapper.append(toastCloseButton);
                toastContent.append(toastCloseWrapper);
            }
            toastDiv.append(toastContent);
        }
        if (toastDuration !== undefined) {
            const toastProgressWrapper = $(`<div class="toast-progress-wrapper"></div>`);
            const toastProgress = $(`<div class="toast-progress"></div>`);
            toastProgress.css('animation-delay', (0,_Utils__WEBPACK_IMPORTED_MODULE_1__.formatCSSDuration)(this.openCloseDuration));
            toastProgress.css('animation-duration', (0,_Utils__WEBPACK_IMPORTED_MODULE_1__.formatCSSDuration)(toastDuration));
            toastProgressWrapper.append(toastProgress);
            toastDiv.append(toastProgressWrapper);
            window.setTimeout(() => {
                this.close(toastDiv);
            }, toastDuration + this.openCloseDuration);
        }
        this.toastMountPoint.append(toastDiv);
    }
    close(toastDiv) {
        toastDiv.removeClass('open');
        toastDiv.addClass('close');
        window.setTimeout(() => {
            toastDiv.remove();
        }, this.openCloseDuration);
    }
}


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(10);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(11);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(12);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(13);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(14);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_node_modules_sass_loader_dist_cjs_js_Toast_scss__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(15);

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_node_modules_sass_loader_dist_cjs_js_Toast_scss__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_node_modules_sass_loader_dist_cjs_js_Toast_scss__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_node_modules_sass_loader_dist_cjs_js_Toast_scss__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_node_modules_sass_loader_dist_cjs_js_Toast_scss__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }),
/* 9 */
/***/ ((module) => {

"use strict";


var stylesInDOM = [];

function getIndexByIdentifier(identifier) {
  var result = -1;

  for (var i = 0; i < stylesInDOM.length; i++) {
    if (stylesInDOM[i].identifier === identifier) {
      result = i;
      break;
    }
  }

  return result;
}

function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];

  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var indexByIdentifier = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3],
      supports: item[4],
      layer: item[5]
    };

    if (indexByIdentifier !== -1) {
      stylesInDOM[indexByIdentifier].references++;
      stylesInDOM[indexByIdentifier].updater(obj);
    } else {
      var updater = addElementStyle(obj, options);
      options.byIndex = i;
      stylesInDOM.splice(i, 0, {
        identifier: identifier,
        updater: updater,
        references: 1
      });
    }

    identifiers.push(identifier);
  }

  return identifiers;
}

function addElementStyle(obj, options) {
  var api = options.domAPI(options);
  api.update(obj);

  var updater = function updater(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap && newObj.supports === obj.supports && newObj.layer === obj.layer) {
        return;
      }

      api.update(obj = newObj);
    } else {
      api.remove();
    }
  };

  return updater;
}

module.exports = function (list, options) {
  options = options || {};
  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];

    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDOM[index].references--;
    }

    var newLastIdentifiers = modulesToDom(newList, options);

    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];

      var _index = getIndexByIdentifier(_identifier);

      if (stylesInDOM[_index].references === 0) {
        stylesInDOM[_index].updater();

        stylesInDOM.splice(_index, 1);
      }
    }

    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ }),
/* 10 */
/***/ ((module) => {

"use strict";


/* istanbul ignore next  */
function apply(styleElement, options, obj) {
  var css = "";

  if (obj.supports) {
    css += "@supports (".concat(obj.supports, ") {");
  }

  if (obj.media) {
    css += "@media ".concat(obj.media, " {");
  }

  var needLayer = typeof obj.layer !== "undefined";

  if (needLayer) {
    css += "@layer".concat(obj.layer.length > 0 ? " ".concat(obj.layer) : "", " {");
  }

  css += obj.css;

  if (needLayer) {
    css += "}";
  }

  if (obj.media) {
    css += "}";
  }

  if (obj.supports) {
    css += "}";
  }

  var sourceMap = obj.sourceMap;

  if (sourceMap && typeof btoa !== "undefined") {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  } // For old IE

  /* istanbul ignore if  */


  options.styleTagTransform(css, styleElement, options.options);
}

function removeStyleElement(styleElement) {
  // istanbul ignore if
  if (styleElement.parentNode === null) {
    return false;
  }

  styleElement.parentNode.removeChild(styleElement);
}
/* istanbul ignore next  */


function domAPI(options) {
  var styleElement = options.insertStyleElement(options);
  return {
    update: function update(obj) {
      apply(styleElement, options, obj);
    },
    remove: function remove() {
      removeStyleElement(styleElement);
    }
  };
}

module.exports = domAPI;

/***/ }),
/* 11 */
/***/ ((module) => {

"use strict";


var memo = {};
/* istanbul ignore next  */

function getTarget(target) {
  if (typeof memo[target] === "undefined") {
    var styleTarget = document.querySelector(target); // Special case to return head of iframe instead of iframe itself

    if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
      try {
        // This will throw an exception if access to iframe is blocked
        // due to cross-origin restrictions
        styleTarget = styleTarget.contentDocument.head;
      } catch (e) {
        // istanbul ignore next
        styleTarget = null;
      }
    }

    memo[target] = styleTarget;
  }

  return memo[target];
}
/* istanbul ignore next  */


function insertBySelector(insert, style) {
  var target = getTarget(insert);

  if (!target) {
    throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
  }

  target.appendChild(style);
}

module.exports = insertBySelector;

/***/ }),
/* 12 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


/* istanbul ignore next  */
function setAttributesWithoutAttributes(styleElement) {
  var nonce =  true ? __webpack_require__.nc : 0;

  if (nonce) {
    styleElement.setAttribute("nonce", nonce);
  }
}

module.exports = setAttributesWithoutAttributes;

/***/ }),
/* 13 */
/***/ ((module) => {

"use strict";


/* istanbul ignore next  */
function insertStyleElement(options) {
  var element = document.createElement("style");
  options.setAttributes(element, options.attributes);
  options.insert(element, options.options);
  return element;
}

module.exports = insertStyleElement;

/***/ }),
/* 14 */
/***/ ((module) => {

"use strict";


/* istanbul ignore next  */
function styleTagTransform(css, styleElement) {
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild);
    }

    styleElement.appendChild(document.createTextNode(css));
  }
}

module.exports = styleTagTransform;

/***/ }),
/* 15 */
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(16);
/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(17);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".nln-toast {\n  box-sizing: content-box;\n  position: absolute;\n  top: calc(var(--theme-topbar-height) + 10px);\n  left: 50%;\n  border: 1px solid var(--theme-content-border-color);\n  border-radius: 6px;\n  overflow: hidden;\n  color: var(--theme-body-font-color);\n}\n.nln-toast.error {\n  background-color: rgba(255, 0, 0, 0.6);\n}\n.nln-toast.error .toast-progress {\n  background-color: #F00;\n}\n.nln-toast .toast-text {\n  padding: 1em;\n}\n.nln-toast .toast-content {\n  display: grid;\n  grid-template-columns: 1fr 0.25fr;\n}\n.nln-toast .toast-close-wrapper {\n  display: flex;\n  align-content: center;\n  justify-content: center;\n}\n.nln-toast .toast-close-button {\n  background: none;\n  border: none;\n  cursor: pointer;\n  color: var(--theme-body-font-color);\n}\n.nln-toast .toast-progress-wrapper {\n  width: 100%;\n  height: 10px;\n  border-top: 1px solid var(--theme-content-border-color);\n  background-color: var(--theme-background-color);\n}\n.nln-toast .toast-progress {\n  width: 100%;\n  height: 100%;\n  animation-name: progressAnimate;\n  animation-direction: normal;\n  animation-fill-mode: forwards;\n  animation-timing-function: linear;\n}\n@keyframes progressAnimate {\n  0% {\n    width: 100%;\n  }\n  100% {\n    width: 0;\n  }\n}\n.nln-toast.open {\n  animation-name: fadeInDown;\n  animation-fill-mode: forwards;\n  animation-timing-function: ease-in-out;\n}\n@keyframes fadeUpOut {\n  0% {\n    opacity: 1;\n    transform: translateY(0);\n  }\n  100% {\n    opacity: 0;\n    transform: translateY(-100px);\n  }\n}\n.nln-toast.close {\n  animation-name: fadeUpOut;\n  animation-fill-mode: forwards;\n  animation-timing-function: ease-in-out;\n}\n@keyframes fadeInDown {\n  0% {\n    opacity: 0;\n    transform: translateY(-100px);\n  }\n  100% {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}", ""]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),
/* 16 */
/***/ ((module) => {

"use strict";


module.exports = function (i) {
  return i[1];
};

/***/ }),
/* 17 */
/***/ ((module) => {

"use strict";


/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
module.exports = function (cssWithMappingToString) {
  var list = []; // return the list of modules as css string

  list.toString = function toString() {
    return this.map(function (item) {
      var content = "";
      var needLayer = typeof item[5] !== "undefined";

      if (item[4]) {
        content += "@supports (".concat(item[4], ") {");
      }

      if (item[2]) {
        content += "@media ".concat(item[2], " {");
      }

      if (needLayer) {
        content += "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {");
      }

      content += cssWithMappingToString(item);

      if (needLayer) {
        content += "}";
      }

      if (item[2]) {
        content += "}";
      }

      if (item[4]) {
        content += "}";
      }

      return content;
    }).join("");
  }; // import a list of modules into the list


  list.i = function i(modules, media, dedupe, supports, layer) {
    if (typeof modules === "string") {
      modules = [[null, modules, undefined]];
    }

    var alreadyImportedModules = {};

    if (dedupe) {
      for (var k = 0; k < this.length; k++) {
        var id = this[k][0];

        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }

    for (var _k = 0; _k < modules.length; _k++) {
      var item = [].concat(modules[_k]);

      if (dedupe && alreadyImportedModules[item[0]]) {
        continue;
      }

      if (typeof layer !== "undefined") {
        if (typeof item[5] === "undefined") {
          item[5] = layer;
        } else {
          item[1] = "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {").concat(item[1], "}");
          item[5] = layer;
        }
      }

      if (media) {
        if (!item[2]) {
          item[2] = media;
        } else {
          item[1] = "@media ".concat(item[2], " {").concat(item[1], "}");
          item[2] = media;
        }
      }

      if (supports) {
        if (!item[4]) {
          item[4] = "".concat(supports);
        } else {
          item[1] = "@supports (".concat(item[4], ") {").concat(item[1], "}");
          item[4] = supports;
        }
      }

      list.push(item);
    }
  };

  return list;
};

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _Utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var _UI_Dashboard_FlaggingDashboard__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2);
/* harmony import */ var _SE_API__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(4);
/* harmony import */ var _GlobalVars__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(5);
/* harmony import */ var _GM_config_index__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(6);
/* harmony import */ var _GM_config_index__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_GM_config_index__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _UI_Toast_Toast__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(7);






_GM_config_index__WEBPACK_IMPORTED_MODULE_4___default().init({
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
            'min': 60,
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
            'min': 15,
            'max': 600,
            'default': 600
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
function postTypeFilter(actualPT) {
    const configPT = _GM_config_index__WEBPACK_IMPORTED_MODULE_4___default().get('POST_TYPE');
    if (configPT === 'all') {
        return true;
    }
    else {
        return configPT === actualPT;
    }
}
function UserScript() {
    const SITE_NAME = _GM_config_index__WEBPACK_IMPORTED_MODULE_4___default().get('SITE_NAME');
    const ACCESS_TOKEN = _GM_config_index__WEBPACK_IMPORTED_MODULE_4___default().get('ACCESS_TOKEN');
    const KEY = _GM_config_index__WEBPACK_IMPORTED_MODULE_4___default().get('KEY');
    if (!SITE_NAME || !ACCESS_TOKEN || !KEY) {
        _GM_config_index__WEBPACK_IMPORTED_MODULE_4___default().open();
    }
    const AUTH_STR = `site=${SITE_NAME}&access_token=${ACCESS_TOKEN}&key=${KEY}`;
    const COMMENT_FILTER = '!SVaJvZISgqg34qVVD)';
    const API_REQUEST_RATE = _GM_config_index__WEBPACK_IMPORTED_MODULE_4___default().get('DELAY_BETWEEN_API_CALLS') * 1000;
    const settingsButton = $('<span title="NLN Comment Flagging Dashboard Settings" style="font-size:15pt;cursor: pointer;" class="s-topbar--item">⚙</span>');
    settingsButton.on('click', () => _GM_config_index__WEBPACK_IMPORTED_MODULE_4___default().open());
    const li = $('<li></li>');
    li.append(settingsButton);
    $('header ol.s-topbar--content > li:nth-child(2)').after(li);
    const fkey = StackExchange.options.user.fkey;
    let lastSuccessfulRead = Math.floor(((0,_Utils__WEBPACK_IMPORTED_MODULE_0__.getOffset)(_GM_config_index__WEBPACK_IMPORTED_MODULE_4___default().get('HOUR_OFFSET')) - API_REQUEST_RATE) / 1000);
    const toaster = new _UI_Toast_Toast__WEBPACK_IMPORTED_MODULE_5__.Toast("NLN-Toast-Container");
    toaster.open('Flagging too fast!', 'error', 10000);
    const UI = new _UI_Dashboard_FlaggingDashboard__WEBPACK_IMPORTED_MODULE_1__.FlaggingDashboard($('#mainbar'), fkey, {
        displayLink: _GM_config_index__WEBPACK_IMPORTED_MODULE_4___default().get('UI_DISPLAY_LINK_TO_COMMENT'),
        displayPostType: _GM_config_index__WEBPACK_IMPORTED_MODULE_4___default().get('UI_DISPLAY_POST_TYPE'),
        displayNoiseRatio: _GM_config_index__WEBPACK_IMPORTED_MODULE_4___default().get('UI_DISPLAY_NOISE_RATIO'),
        displayFlagUI: _GM_config_index__WEBPACK_IMPORTED_MODULE_4___default().get('UI_DISPLAY_FLAG_BUTTON'),
        displayBlacklistMatches: _GM_config_index__WEBPACK_IMPORTED_MODULE_4___default().get('UI_DISPLAY_BLACKLIST_MATCHES'),
        displayCommentDeleteState: _GM_config_index__WEBPACK_IMPORTED_MODULE_4___default().get('UI_DISPLAY_COMMENT_DELETE_STATE'),
        shouldUpdateTitle: _GM_config_index__WEBPACK_IMPORTED_MODULE_4___default().get('DOCUMENT_TITLE_SHOULD_UPDATE')
    }, toaster);
    UI.init();
    if (_GM_config_index__WEBPACK_IMPORTED_MODULE_4___default().get('ACTIVE')) {
        UI.render();
    }
    const main = async (mainInterval) => {
        const toDate = Math.floor((0,_Utils__WEBPACK_IMPORTED_MODULE_0__.getOffset)(_GM_config_index__WEBPACK_IMPORTED_MODULE_4___default().get('HOUR_OFFSET')) / 1000);
        const response = await (0,_SE_API__WEBPACK_IMPORTED_MODULE_2__.getComments)(AUTH_STR, COMMENT_FILTER, lastSuccessfulRead, toDate);
        if (response.quota_remaining <= _GM_config_index__WEBPACK_IMPORTED_MODULE_4___default().get('API_QUOTA_LIMIT')) {
            window.clearInterval(mainInterval);
            return;
        }
        if (response.items.length > 0) {
            lastSuccessfulRead = toDate + 1;
            response.items.forEach((comment) => {
                if (postTypeFilter(comment.post_type) && comment.body_markdown.length <= _GM_config_index__WEBPACK_IMPORTED_MODULE_4___default().get('MAXIMUM_LENGTH_COMMENT')) {
                    const decodedMarkdown = (0,_Utils__WEBPACK_IMPORTED_MODULE_0__.htmlDecode)(comment.body_markdown) || '';
                    const blacklistMatches = decodedMarkdown.replace(/`.*`/g, '').match(_GlobalVars__WEBPACK_IMPORTED_MODULE_3__.blacklist);
                    if (blacklistMatches && !decodedMarkdown.match(_GlobalVars__WEBPACK_IMPORTED_MODULE_3__.whitelist)) {
                        const noiseRatio = (0,_Utils__WEBPACK_IMPORTED_MODULE_0__.calcNoiseRatio)(blacklistMatches, decodedMarkdown.replace(/\B@\w+/g, '').length);
                        if (noiseRatio >= _GM_config_index__WEBPACK_IMPORTED_MODULE_4___default().get('DISPLAY_CERTAINTY')) {
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
    if (_GM_config_index__WEBPACK_IMPORTED_MODULE_4___default().get('ACTIVE')) {
        if (_GM_config_index__WEBPACK_IMPORTED_MODULE_4___default().get('RUN_IMMEDIATELY')) {
            main();
        }
        const mainInterval = window.setInterval(() => main(mainInterval), API_REQUEST_RATE);
    }
}
UserScript();

})();

/******/ })()
;