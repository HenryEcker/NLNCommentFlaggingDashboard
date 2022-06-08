// ==UserScript==
// @name        NLN Comment Flagging Dashboard
// @description Find comments which may potentially be no longer needed and place them in a convenient flagging dashboard
// @homepage    https://github.com/HenryEcker/NLNCommentFlaggingDashboard
// @author      Henry Ecker (https://github.com/HenryEcker)
// @version     2.4.3
// @downloadURL https://github.com/HenryEcker/NLNCommentFlaggingDashboard/raw/master/dist/NLNCommentFlaggingDashboard.user.js
// @updateURL   https://github.com/HenryEcker/NLNCommentFlaggingDashboard/raw/master/dist/NLNCommentFlaggingDashboard.user.js
// @match       *://stackoverflow.com/users/flag-summary/15497888?group=4*
// @grant       GM_getValue
// @grant       GM_setValue
// ==/UserScript==
/* globals $, StackExchange */

(()=>{var t=[,(t,e,n)=>{function a(t,e){return new RegExp(t.map((t=>t.source)).join("|"),e)}function s(t){return t.charAt(0).toUpperCase()+t.slice(1)}function o(t){return(new DOMParser).parseFromString(t,"text/html").documentElement.textContent}function i(t,e=2){return`${t.toFixed(e)}%`}function r(t,e){return t.reduce(((t,e)=>t+e.length),0)/e*100}function l(){return(new Date).getTime()}function d(t){return`${i(t.noise_ratio)} [${t.blacklist_matches.join(",")}] (${t.link})`}function c(t){return t/1e3+"s"}function p(t,e){return Object.entries(t).reduce(((t,[e,n])=>(t.set(e,n),t)),e)}function u(t){return p(t,new FormData)}function g(t){return p(t,new URLSearchParams)}n.r(e),n.d(e,{calcNoiseRatio:()=>r,capitalise:()=>s,formatCSSDuration:()=>c,formatComment:()=>d,formatPercentage:()=>i,getCurrentTimestamp:()=>l,getFormDataFromObject:()=>u,getURLSearchParamsFromObject:()=>g,htmlDecode:()=>o,mergeRegexes:()=>a})},(t,e,n)=>{n.r(e),n.d(e,{FlaggingDashboard:()=>i});var a=n(3),s=n(1),o=n(4);class i{constructor(t,e,n,a){this.htmlIds={containerDivId:"NLN_Comment_Wrapper",tableId:"NLN_Comment_Reports_Table",tableBodyId:"NLN_Comment_Reports_Table_Body",styleId:"nln-comment-userscript-styles",remainingFlags:"NLN_Remaining_Comment_Flags",commentScanCount:"nln-comment-scan-count",settingContainerDiv:"nln-dashboard-settings-container"},this.SO={CSS:{tableContainerDiv:"s-table-container",table:"s-table",buttonPrimary:"s-btn s-btn__primary",buttonGeneral:"s-btn",flagsRemainingDiv:"flex--item ml-auto fc-light",footer:"d-flex gs8 gsx ai-center"},HTML:{pendingSpan:'<span class="supernovabg mod-flag-indicator">pending</span>',spinner:(t,e)=>`<div class="s-spinner s-spinner__${t}"><div class="v-visible-sr">${e}</div></div>`}},this.mountPoint=t,this.flagsRemainingDiv=$(`<div class="${this.SO.CSS.flagsRemainingDiv}" id="${this.htmlIds.remainingFlags}"></div>`),this.fkey=e,this.settings=n,this.toaster=a,this.tableData={}}init(){this.buildBaseStyles(),this.buildBaseUI()}buildBaseStyles(){const t=document.createElement("style");t.setAttribute("id",this.htmlIds.styleId),t.innerHTML=`\n#${this.htmlIds.containerDivId} {\n    padding: 25px 0;\n    display: grid;\n    grid-template-rows: 25px min-content 1fr 40px;\n    grid-gap: 10px;\n}\n\n#${this.htmlIds.settingContainerDiv} {\n    display: flex;\n    gap: 25px;\n    flex-wrap: wrap;\n    flex-direction: row;\n    align-items: center;\n}\n\n.nln-setting-elem-container {\n    display: flex;\n    align-items: center;\n    gap: 7px;\n}\n\n#${this.htmlIds.settingContainerDiv} select {\n    height: min-content;\n}\n`,document.head.appendChild(t)}buildBaseUI(){const t=$(`<div id="${this.htmlIds.containerDivId}"></div>`);{const e=$('<div class="nln-header"></div>');e.append($(`<h2>NLN Comment Flagging Dashboard <span id="${this.htmlIds.commentScanCount}" title="Total Number of Comments (without filters)"></span></h2>`)),t.append(e)}const e=$('<div id="nln-dashboard-settings-container"></div>');t.append(e);const n=()=>{{const t=(t,e,n)=>{const a=this.settings.getConfigProfile(t),s=`SLIDER_${t}`,o=$('<div class="nln-setting-elem-container"></div>'),i=$(`<input id="${s}" type='range' min='${a.attributes?.min}' max='${a.attributes?.max}' step='${a.attributes?.step}' value='${this.settings.get(t)}' class='slider'>`),r=$(`<span>${n(this.settings.get(t))}</span>`);return i.on("input",(t=>{r.text(n(t.target.value))})),i.on("change",(e=>{this.settings.set(t,Number(e.target.value)),this.render()})),o.append(`<label for="${s}">${e}</label>`),o.append(i),o.append(r),o};e.append(t("DISPLAY_CERTAINTY","Display Certainty",(t=>`${Number(t).toFixed(2)}%`))),e.append(t("MAXIMUM_LENGTH_COMMENT","Maximum Length",(t=>`${Number(t).toFixed(0)}`)))}{const t=(t,e)=>{const n=this.settings.getConfigProfile(t),a=`SELECT_${t}`,s=$('<div class="nln-setting-elem-container"></div>'),o=$(`<select id="${a}"></select>`);n.options.forEach((t=>{o.append($(`<option value="${t}">${t}</option>`))}));const i=this.settings.get(t);return void 0!==i&&o.val(i.toString()),o.on("change",(e=>{this.settings.set(t,e.target.value),this.render()})),s.append(`<label for="${a}">${e}</label>`),s.append(o),s};e.append(t("POST_TYPE","Post Type"))}{const t=(t,e)=>{const n=$('<div class="nln-setting-elem-container"></div>'),a=`CHECKBOX_${t}`,s=$(`<input id='${a}' type="checkbox" checked="${this.settings.get(t)}"/>`);return s.on("change",(e=>{this.settings.set(t,Boolean(e.target.checked)),this.render()})),n.append(`<label for="${a}">${e}</label>`),n.append(s),n};e.append(t("FILTER_WHITELIST","Filter Whitelist"))}{const t=$(`<button style="margin-left: auto" class="${this.SO.CSS.buttonGeneral}">Reset</button>`);t.on("click",(t=>{t.preventDefault(),this.settings.reload(),e.empty(),n(),this.render()})),e.append(t)}{const t=$(`<button class="${this.SO.CSS.buttonGeneral}">Save</button>`);t.on("click",(e=>{e.preventDefault(),this.settings.save(),t.blur()})),e.append(t)}};n();{const e=$(`<div class="${this.SO.CSS.tableContainerDiv}"></div>`),n=$(`<table id="${this.htmlIds.tableId}" class="${this.SO.CSS.table}"></table>`),a=$("<thead></thead>"),s=$("<tr></tr>");s.append($("<th>Comment Text</th>")),this.settings.get("UI_DISPLAY_COMMENT_OWNER")&&s.append($("<th>Author</th>")),this.settings.get("UI_DISPLAY_POST_TYPE")&&s.append($("<th>Post Type</th>")),this.settings.get("UI_DISPLAY_LINK_TO_COMMENT")&&s.append($("<th>Link</th>")),this.settings.get("UI_DISPLAY_BLACKLIST_MATCHES")&&s.append($("<th>Blacklist Matches</th>")),this.settings.get("UI_DISPLAY_WHITELIST_MATCHES")&&s.append($("<th>Whitelist Matches</th>")),this.settings.get("UI_DISPLAY_NOISE_RATIO")&&s.append($("<th>Noise Ratio</th>")),this.settings.get("UI_DISPLAY_FLAG_BUTTON")&&s.append($("<th>Flag</th>")),this.settings.get("UI_DISPLAY_COMMENT_DELETE_STATE")&&s.append($("<th>Deleted</th>")),s.append($("<th>Clear</th>")),a.append(s),n.append(a),n.append($(`<tbody id="${this.htmlIds.tableBodyId}"></tbody>`)),e.append(n),t.append(e)}{const e=$(`<div class="nln-footer ${this.SO.CSS.footer}"></div>`);{const t=$(`<button class="${this.SO.CSS.buttonPrimary}">Clear All</button>`);t.on("click",(()=>{this.tableData={},t.blur(),this.render()})),e.append(t);const n=$(`<button class="${this.SO.CSS.buttonGeneral}" style="margin-left: 5px">Clear Handled</button>`);n.on("click",(()=>{this.tableData=Object.entries(this.tableData).reduce(((t,[e,n])=>(!n.can_flag||n?.was_flagged||n?.was_deleted||(t[e]=n),t)),{}),n.blur(),this.render()})),e.append(n)}e.append(this.flagsRemainingDiv),t.append(e)}this.mountPoint.before(t),this.updateNumberOfComments()}static postTypeFilter(t,e){return"all"===t||t===e}shouldRenderRow(t){return i.postTypeFilter(this.settings.get("POST_TYPE"),t.post_type)&&(!this.settings.get("FILTER_WHITELIST")||0===t.whitelist_matches.length)&&t.body_markdown.length<=this.settings.get("MAXIMUM_LENGTH_COMMENT")&&t.noise_ratio>=this.settings.get("DISPLAY_CERTAINTY")}render(){const t=$(`#${this.htmlIds.tableBodyId}`);t.empty(),Object.values(this.tableData).forEach((e=>{if(this.shouldRenderRow(e)){const n=$("<tr></tr>");if(n.append(`<td>${e.body}</td>`),this.settings.get("UI_DISPLAY_COMMENT_OWNER")&&n.append(`<td><a href="${e.owner.link}" target="_blank">${e.owner.display_name}</a></td>`),this.settings.get("UI_DISPLAY_POST_TYPE")&&n.append(`<td>${(0,s.capitalise)(e.post_type)}</td>`),this.settings.get("UI_DISPLAY_LINK_TO_COMMENT")&&n.append(`<td><a href="${e.link}" target="_blank">${e._id}</a></td>`),this.settings.get("UI_DISPLAY_BLACKLIST_MATCHES")&&n.append(`<td>${e.blacklist_matches.map((t=>`"${t}"`)).join(", ")}</td>`),this.settings.get("UI_DISPLAY_WHITELIST_MATCHES")&&n.append(`<td>${e.whitelist_matches.map((t=>`"${t}"`)).join(", ")}</td>`),this.settings.get("UI_DISPLAY_NOISE_RATIO")&&n.append(`<td>${(0,s.formatPercentage)(e.noise_ratio)}</td>`),this.settings.get("UI_DISPLAY_FLAG_BUTTON"))if(e.can_flag)if(e.was_flagged)n.append("<td>✓</td>");else{const t=$(`<button data-comment-id="${e._id}" class="${this.SO.CSS.buttonPrimary}">Flag</button>`);t.on("click",(()=>{t.text("");const n=$(this.SO.HTML.spinner("sm","Flagging..."));t.append(n),this.handleFlagComment(e)}));const a=$("<td></td>");a.append(t),n.append(a)}else n.append("<td>🚫</td>");this.settings.get("UI_DISPLAY_COMMENT_DELETE_STATE")&&(void 0!==e.was_deleted?e.was_deleted?n.append("<td>✓</td>"):n.append(`<td>${this.SO.HTML.pendingSpan}</td>`):n.append("<td></td>"));{const t=$(`<button class="${this.SO.CSS.buttonGeneral}">Clear</button>`);t.on("click",(()=>{this.removeComment(e._id)}));const a=$("<td></td>");a.append(t),n.append(a)}t.append(n)}})),this.updatePageTitle(),this.updateNumberOfComments()}async handleFlagComment(t){const e=await this.updateRemainingFlags(t._id);try{const n=await(0,o.flagComment)(this.fkey,t._id);this.tableData[t._id].was_flagged=n.was_flagged,this.tableData[t._id].was_deleted=n.was_deleted,void 0!==e&&this.setRemainingFlagDisplay(e-1)}catch(e){e instanceof a.RatedLimitedError?this.toaster.open("Flagging too fast!","error"):e instanceof a.AlreadyFlaggedError?(this.toaster.open(e.message,"warning",1e3),this.tableData[t._id].was_flagged=!0,this.tableData[t._id].was_deleted=!1):e instanceof a.AlreadyDeletedError?(this.toaster.open(e.message,"error",1e3),this.tableData[t._id].can_flag=!1,this.tableData[t._id].was_deleted=!0):(e instanceof a.OutOfFlagsError||e instanceof a.FlagAttemptFailed)&&(this.toaster.open(e.message,"error",8e3),this.tableData[t._id].can_flag=!1)}finally{this.render()}}addComments(t){t.length>0&&(this.updateRemainingFlags(t[0]._id),t.forEach((t=>{this.tableData[t._id]=t})),this.render())}updateNumberOfComments(){this.settings.get("TOTAL_NUMBER_OF_POSTS_IN_MEMORY")&&$(`#${this.htmlIds.commentScanCount}`).text(`(${Object.keys(this.tableData).length})`)}removeComment(t){delete this.tableData[t],this.render()}updatePageTitle(){if(this.settings.get("DOCUMENT_TITLE_SHOULD_UPDATE")){const t=Object.values(this.tableData).reduce(((t,e)=>this.shouldRenderRow(e)&&e.can_flag&&!e.was_flagged?t+1:t),0);let e=document.title.replace(/^\(\d+\)\s+/,"");t>0&&(e=`(${t}) ${e}`),document.title=e}}setRemainingFlagDisplay(t){this.flagsRemainingDiv.html(`<span title="The data is updated infrequently the number of flags may be inaccurate">You have ${t} flags left today</span>`)}async updateRemainingFlags(t){if(this.settings.get("UI_DISPLAY_REMAINING_FLAGS"))try{const e=await(0,o.getFlagQuota)(t);return this.setRemainingFlagDisplay(e),e}catch(t){return}}}},(t,e,n)=>{n.r(e),n.d(e,{AlreadyDeletedError:()=>r,AlreadyFlaggedError:()=>l,FlagAttemptFailed:()=>s,OutOfFlagsError:()=>i,RatedLimitedError:()=>o});class a extends Error{constructor(t){super(t),this.name=this.constructor.name}}class s extends a{}class o extends s{}class i extends s{}class r extends s{}class l extends s{}},(t,e,n)=>{n.r(e),n.d(e,{flagComment:()=>r,getComments:()=>o,getFlagQuota:()=>i});var a=n(1),s=n(3);function o(t,e,n,s){const o=(0,a.getURLSearchParamsFromObject)({pagesize:100,order:"desc",sort:"creation",filter:e,fromdate:n,...s&&{todate:s}});return fetch(`https://api.stackexchange.com/2.3/comments?${o.toString()}&${t}`).then((t=>t.json())).then((t=>t))}function i(t){return new Promise(((e,n)=>{$.get(`https://${location.hostname}/flags/comments/${t}/popup`).done((t=>{const n=/you have (\d+) flags left today/i,a=$('div:contains("flags left today")',t).filter(((t,e)=>0===e.childElementCount&&Boolean(e.innerText.match(n)))).last().text().match(n);return null!==a?void e(Number(a[1])):void e(0)})).fail((t=>409===t.status?void n(new s.RatedLimitedError("You may only load the comment flag dialog every 3 seconds")):void n()))}))}function r(t,e){return fetch(`https://${location.hostname}/flags/comments/${e}/add/39`,{method:"POST",body:(0,a.getFormDataFromObject)({fkey:t,otherText:"",overrideWarning:!0})}).then((t=>{if(409===t.status)throw new s.RatedLimitedError("You can only flag once every 5 seconds");if(200===t.status)return t.json();throw new s.FlagAttemptFailed(`Something unexpected went wrong. (${t.status}: "${t.statusText}")`)})).then((t=>{if(t.Success&&0===t.Outcome)return{was_deleted:t.ResultChangedState,was_flagged:!0};if(!t.Success&&2===t.Outcome){if("You have already flagged this comment"===t.Message)throw new s.AlreadyFlaggedError(t.Message);if("This comment is deleted and cannot be flagged"===t.Message)throw new s.AlreadyDeletedError(t.Message);if(t.Message.toLowerCase().includes("out of flag"))throw new s.OutOfFlagsError(t.Message)}throw new s.FlagAttemptFailed(t.Message)}))}},(t,e,n)=>{n.r(e),n.d(e,{FlagAttemptFailed:()=>r,RatedLimitedError:()=>l,blacklist:()=>s,whitelist:()=>o});var a=n(1);const s=(0,a.mergeRegexes)([/(?:[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/,/\s+((?=[!-~])[\W_]){2,}\s*/,/\b(?:t(?:y(?:sm|vm)?|hx)|lm(?:fao|ao)|ily(?:sm)?|om(?:fg|g)|k)\b/,/(?:happy|glad)\s*(?:\w+\s+)*?(he(?:ar|lp))/,/(?:you(r|['’]?re|\s+are)?|that['’]?s?)\s+(?:(a\s+)?(\s+rock\s+star|amazing|awesome|incredible|brilliant|wonderful|rock|perfect|genius))[.!]?/,/(oh\s+)?(my\s+)?(god|goodness)[.!]?|(holy\s+\w+)/,/(?:Any\s+help\s+would\s+be\s+(?:a(?:ppreciated|wesome)|wonderful|great))/,/(?:(this|that|it)?(((['’]s?)|\s+((wa|i)s))\s+)?(it|(what\s+(\w+\s+)*?(need(?:ed|ing)?|looking\s*for)))[.!]?)/,/(?:happy\s+coding)/,/(have a\s+(\w+\s+)*?(day|evening|night)([.!]*)?)/,/(it(['’]?s)?|this)\s*((re)?solved?|fix(ed)?)\s*(((m[ey]|the)\s*(issue|problem))|it)/,/\b(?:b(?:ro(?:ther|o+)|ud(?:dy)?|oss)|f(?:riend(?:io|o)?|ella|am)|s(?:oldier|enpai|ir)|d(?:addy|ude)|ma(?:te|n+)|amigo|homie|pal)\b/,/(?:(?:big\s+|many\s+)?th?ank(?:s|\s*you|\s*u)?(?:\s+a lot|\s+(?:very|so) much|\s+a mil+ion|\s+)?(?:\s*for (?:(your|the)\s+)?(?:help(ing)?)?)?|th?anx|thx|cheers)/,/((this|that|it(['’]?s)?|your)\s+)?(?:\s+(\w+\s+)*?(solution|answer|code)\s+(\w+\s+)*?)?work(?:ed|s|ing)?\s*(?:now|perfectly|great|for\s+me|((like|as)\s+)?(a\s+)?charm|again|[!.])?/,/(?:(?:you(?:['’]?re?|\s+are)\s+)?welcome|my pleasure)+/,/(?:(?:I\s+)?(?:hope\s+)?(?:your\s+|(?:this\s+|that\s+|it\s+)(?:was\s+|is\s+)?)?(?:very\s+)?help(?:ful|ed|s)|useful(?:\s+a lot|\s+(?:very|so) much)?)+/,/(?:a(?:mazing|wesome)|br(?:illiant|avo)|excellent|fantastic|ingenious|marvelous|wonderful|perfect|superb|w+o+w+)/,/(?:you(['’]?re?|\s+are|['’]?ve|\s+have)?|this(\s+(wa|i|['’])s)?\s+)?(?:a\s+life(-|\s+)saver|sav(e|ed|ing)\s+(m[ey]|the|it))/,/(?:please(?:\s+\w+)*\s+)?accept(?:ed|ing)?\b(?:\s+the\s+answer)?/,/(?:please(?:\s+\w+)\s+)?(?:give an?\s+)?upvot(?:ed?|ing)(?:\s+the answer)?/,/(?:is|should be)(?:\s+\w+)*\s+(?:right|correct|accepted)(?:\s+\w+)*\s+(?:answer|solution)/,/(?:(https:\/\/stackoverflow.com)?\/help\/(someone-answers|accepted-answer))/],"gi"),o=(0,a.mergeRegexes)([/\b(?:n(?:eed|ot)|unfortunate(ly)?|persists?|require|but|unaccept(ed)?)\b/,/\b(?:d(?:o(?:esn(?:'t?|’t?|t)|n(?:'t?|’t?|t))|idn(?:'t?|’t?|t))|c(?:ouldn(?:'t?|’t?|t)|an(?:'t?|’t?|t))|ha(?:ven(?:'t?|’t?|t)|sn(?:'t?|’t?|t))|wo(?:uldn(?:'t?|’t?|t)|n(?:'t?|’t?|t))|a(?:ren(?:'t?|’t?|t)|in(?:'t?|’t?|t))|shouldn(?:'t?|’t?|t)|isn(?:'t?|’t?|t))\b/,/\b(will|I'?ll)\s*try\b/,/[?]/],"gi");class i extends Error{constructor(t){super(t),this.name=this.constructor.name}}class r extends i{}class l extends i{}},(t,e,n)=>{n.r(e),n.d(e,{Toast:()=>s});n(7);var a=n(1);class s{constructor(t,e=450){this.toastMountPoint=$(`<div id="${t}"></div>`),$("body").append(this.toastMountPoint),this.openCloseDuration=e}open(t,e,n=5e3){const s=$(`<div class="nln-toast open ${e}"></div>`);s.css("animation-duration",(0,a.formatCSSDuration)(this.openCloseDuration));{const e=$('<div class="toast-content"></div></div>');{const n=$(`<div class="toast-text"><span>${t}</span></div>`);e.append(n)}{const t=$('<div class="toast-close-wrapper"></div>'),n=$('<button title="close" class="toast-close-button">X</button>');n.on("click",(()=>{this.close(s)})),t.append(n),e.append(t)}s.append(e)}if(void 0!==n){const t=$('<div class="toast-progress-wrapper"></div>'),e=$('<div class="toast-progress"></div>');e.css("animation-delay",(0,a.formatCSSDuration)(this.openCloseDuration)),e.css("animation-duration",(0,a.formatCSSDuration)(n)),t.append(e),s.append(t),window.setTimeout((()=>{this.close(s)}),n+this.openCloseDuration)}this.toastMountPoint.append(s)}close(t){t.removeClass("open"),t.addClass("close"),window.setTimeout((()=>{t.remove()}),this.openCloseDuration)}}},(t,e,n)=>{n.r(e),n.d(e,{default:()=>b});var a=n(8),s=n.n(a),o=n(9),i=n.n(o),r=n(10),l=n.n(r),d=n(11),c=n.n(d),p=n(12),u=n.n(p),g=n(13),h=n.n(g),m=n(14),f={};f.styleTagTransform=h(),f.setAttributes=c(),f.insert=l().bind(null,"head"),f.domAPI=i(),f.insertStyleElement=u();s()(m.default,f);const b=m.default&&m.default.locals?m.default.locals:void 0},t=>{var e=[];function n(t){for(var n=-1,a=0;a<e.length;a++)if(e[a].identifier===t){n=a;break}return n}function a(t,a){for(var o={},i=[],r=0;r<t.length;r++){var l=t[r],d=a.base?l[0]+a.base:l[0],c=o[d]||0,p="".concat(d," ").concat(c);o[d]=c+1;var u=n(p),g={css:l[1],media:l[2],sourceMap:l[3],supports:l[4],layer:l[5]};if(-1!==u)e[u].references++,e[u].updater(g);else{var h=s(g,a);a.byIndex=r,e.splice(r,0,{identifier:p,updater:h,references:1})}i.push(p)}return i}function s(t,e){var n=e.domAPI(e);n.update(t);return function(e){if(e){if(e.css===t.css&&e.media===t.media&&e.sourceMap===t.sourceMap&&e.supports===t.supports&&e.layer===t.layer)return;n.update(t=e)}else n.remove()}}t.exports=function(t,s){var o=a(t=t||[],s=s||{});return function(t){t=t||[];for(var i=0;i<o.length;i++){var r=n(o[i]);e[r].references--}for(var l=a(t,s),d=0;d<o.length;d++){var c=n(o[d]);0===e[c].references&&(e[c].updater(),e.splice(c,1))}o=l}}},t=>{t.exports=function(t){var e=t.insertStyleElement(t);return{update:function(n){!function(t,e,n){var a="";n.supports&&(a+="@supports (".concat(n.supports,") {")),n.media&&(a+="@media ".concat(n.media," {"));var s=void 0!==n.layer;s&&(a+="@layer".concat(n.layer.length>0?" ".concat(n.layer):""," {")),a+=n.css,s&&(a+="}"),n.media&&(a+="}"),n.supports&&(a+="}");var o=n.sourceMap;o&&"undefined"!=typeof btoa&&(a+="\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(o))))," */")),e.styleTagTransform(a,t,e.options)}(e,t,n)},remove:function(){!function(t){if(null===t.parentNode)return!1;t.parentNode.removeChild(t)}(e)}}}},t=>{var e={};t.exports=function(t,n){var a=function(t){if(void 0===e[t]){var n=document.querySelector(t);if(window.HTMLIFrameElement&&n instanceof window.HTMLIFrameElement)try{n=n.contentDocument.head}catch(t){n=null}e[t]=n}return e[t]}(t);if(!a)throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");a.appendChild(n)}},(t,e,n)=>{t.exports=function(t){var e=n.nc;e&&t.setAttribute("nonce",e)}},t=>{t.exports=function(t){var e=document.createElement("style");return t.setAttributes(e,t.attributes),t.insert(e,t.options),e}},t=>{t.exports=function(t,e){if(e.styleSheet)e.styleSheet.cssText=t;else{for(;e.firstChild;)e.removeChild(e.firstChild);e.appendChild(document.createTextNode(t))}}},(t,e,n)=>{n.r(e),n.d(e,{default:()=>r});var a=n(15),s=n.n(a),o=n(16),i=n.n(o)()(s());i.push([t.id,".nln-toast {\n  box-sizing: content-box;\n  position: fixed;\n  top: calc(var(--theme-topbar-height) + 10px);\n  left: 50%;\n  border-radius: 6px;\n  overflow: hidden;\n}\n.nln-toast.error {\n  border: 1px solid var(--theme-content-border-color);\n  color: var(--theme-body-font-color);\n  background-color: rgba(255, 0, 0, 0.65);\n}\n.nln-toast.error .toast-close-button {\n  color: var(--theme-body-font-color);\n}\n.nln-toast.error .toast-progress-wrapper {\n  border-top: 1px solid var(--theme-content-border-color);\n}\n.nln-toast.error .toast-progress {\n  background-color: rgb(255, 0, 0);\n}\n.nln-toast.warning {\n  border: 1px solid var(--theme-content-border-color);\n  color: var(--theme-body-font-color);\n  background-color: rgba(244, 130, 37, 0.65);\n}\n.nln-toast.warning .toast-close-button {\n  color: var(--theme-body-font-color);\n}\n.nln-toast.warning .toast-progress-wrapper {\n  border-top: 1px solid var(--theme-content-border-color);\n}\n.nln-toast.warning .toast-progress {\n  background-color: hsl(27deg, 90%, 55%);\n}\n.nln-toast .toast-text {\n  padding: 1em;\n}\n.nln-toast .toast-content {\n  display: grid;\n  grid-template-columns: 1fr 0.25fr;\n}\n.nln-toast .toast-close-wrapper {\n  display: flex;\n  align-content: center;\n  justify-content: center;\n}\n.nln-toast .toast-close-button {\n  background: none;\n  border: none;\n  cursor: pointer;\n}\n.nln-toast .toast-progress-wrapper {\n  width: 100%;\n  height: 10px;\n  background-color: var(--theme-background-color);\n}\n.nln-toast .toast-progress {\n  width: 100%;\n  height: 100%;\n  animation-name: progressAnimate;\n  animation-direction: normal;\n  animation-fill-mode: forwards;\n  animation-timing-function: linear;\n}\n@keyframes progressAnimate {\n  0% {\n    width: 100%;\n  }\n  100% {\n    width: 0;\n  }\n}\n.nln-toast.open {\n  animation-name: fadeInDown;\n  animation-fill-mode: forwards;\n  animation-timing-function: ease-in-out;\n}\n@keyframes fadeInDown {\n  0% {\n    opacity: 0;\n    transform: translateY(-100px);\n  }\n  100% {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.nln-toast.close {\n  animation-name: fadeUpOut;\n  animation-fill-mode: forwards;\n  animation-timing-function: ease-in-out;\n}\n@keyframes fadeUpOut {\n  0% {\n    opacity: 1;\n    transform: translateY(0);\n  }\n  100% {\n    opacity: 0;\n    transform: translateY(-100px);\n  }\n}",""]);const r=i},t=>{t.exports=function(t){return t[1]}},t=>{t.exports=function(t){var e=[];return e.toString=function(){return this.map((function(e){var n="",a=void 0!==e[5];return e[4]&&(n+="@supports (".concat(e[4],") {")),e[2]&&(n+="@media ".concat(e[2]," {")),a&&(n+="@layer".concat(e[5].length>0?" ".concat(e[5]):""," {")),n+=t(e),a&&(n+="}"),e[2]&&(n+="}"),e[4]&&(n+="}"),n})).join("")},e.i=function(t,n,a,s,o){"string"==typeof t&&(t=[[null,t,void 0]]);var i={};if(a)for(var r=0;r<this.length;r++){var l=this[r][0];null!=l&&(i[l]=!0)}for(var d=0;d<t.length;d++){var c=[].concat(t[d]);a&&i[c[0]]||(void 0!==o&&(void 0===c[5]||(c[1]="@layer".concat(c[5].length>0?" ".concat(c[5]):""," {").concat(c[1],"}")),c[5]=o),n&&(c[2]?(c[1]="@media ".concat(c[2]," {").concat(c[1],"}"),c[2]=n):c[2]=n),s&&(c[4]?(c[1]="@supports (".concat(c[4],") {").concat(c[1],"}"),c[4]=s):c[4]="".concat(s)),e.push(c))}},e}},(t,e,n)=>{n.r(e),n.d(e,{SettingsUI:()=>a});n(18);class a{constructor(t,e){this.SO={CSS:{buttonPrimary:"s-btn s-btn__primary",buttonGeneral:"s-btn"}},this.mountPoint=t,this.config=e,this.defaultConfigVars=Object.values(e.fields).reduce(((t,e)=>(Object.entries(e).forEach((([e,n])=>{void 0!==n.default&&(t[e]=n.default)})),t)),{}),this.currentConfigVars=this.load(),this.formConfigVars={},this.boundEscapeHandler=this.escapeKeyHandler.bind(this)}load(){const t=GM_getValue(this.config.id);return t?JSON.parse(t):{}}reload(){this.currentConfigVars=this.load()}save(){GM_setValue(this.config.id,JSON.stringify(this.currentConfigVars))}get(t){return void 0!==this.currentConfigVars[t]?this.currentConfigVars[t]:this.defaultConfigVars[t]}getConfigProfile(t){let e;return Object.entries(this.config.fields).forEach((([,n])=>{Object.entries(n).forEach((([n,a])=>{n===t&&(e=a)}))})),e}set(t,e){this.currentConfigVars[t]=e}buildSelect(t,e,n,a){const s=$("<select></select>");return s.attr("id",t),n.options.forEach((t=>{s.append($(`<option value="${t}">${t}</option>`))})),void 0!==a&&s.val(a.toString()),s.on("change",(t=>{this.formConfigVars[e]=t.target.value})),s}buildInput(t,e,n,a){const s=$("<input>");return s.attr("id",t),s.attr("type",n.type),void 0!==n.attributes&&Object.entries(n.attributes).forEach((([t,e])=>{s.attr(t,e.toString())})),void 0!==a&&("checkbox"===n.type&&!0===a?s.prop("checked",a):s.attr("value",a)),s.on("change",(t=>{const n=t.target;"checkbox"===n.type?this.formConfigVars[e]=n.checked:this.formConfigVars[e]="number"===n.type?Number(n.value):n.value})),s}buildFieldRow(t,e){const n=$('<div class="nln-field-row"></div>'),a=`${this.config.id}_${t}`,s=$(`<label id="${a}_label" for="${a}">${e.label}</label>`);n.append(s);const o=this.formConfigVars[t];return"select"===e.type?n.append(this.buildSelect(a,t,e,o)):n.append(this.buildInput(a,t,e,o)),n}buildHeaderUI(){const t=$('<div class="nln-config-header"></div>');t.append($(`<span class="nln-header-text">${this.config.title}</span>`));const e=$('<button class="nln-config-close-button" title="close this popup (or hit Esc)">×</button>');return e.on("click",(()=>{this.close()})),t.append(e),t}buildFormUI(){const t=$("<form></form>");Object.entries(this.config.fields).forEach((([e,n])=>{const a=$("<fieldset></fieldset>"),s=$(`<legend>${e}</legend>`);a.append(s),Object.entries(n).forEach((([t,e])=>{a.append(this.buildFieldRow(t,e))})),t.append(a)}));const e=$('<div class="nln-config-buttons"></div>'),n=$(`<button class="${this.SO.CSS.buttonPrimary}" type="submit" title="save the current settings and reload the page">Save and Reload</button>`),a=$(`<button class="${this.SO.CSS.buttonGeneral}" type="button" title="revert any changes to the last save point">Revert Changes</button>`),s=$(`<button class="${this.SO.CSS.buttonGeneral}" type="reset" title="reset all values to their defaults">Reset to default</button>`);return t.on("submit",(t=>{t.preventDefault(),this.currentConfigVars={...this.formConfigVars},this.save(),window.location.reload()})),a.on("click",(t=>{t.preventDefault(),this.formConfigVars={...this.defaultConfigVars,...this.currentConfigVars},this.buildUI()})),t.on("reset",(t=>{t.preventDefault(),this.formConfigVars={...this.defaultConfigVars},this.buildUI()})),e.append(s),e.append(a),e.append(n),t.append(e),t}buildUI(){this.mountPoint.empty();const t=$('<div class="nln-config-modal-background"></div>'),e=$('<div class="nln-config-modal"></div>');e.append(this.buildHeaderUI()),e.append(this.buildFormUI()),t.append(e),this.mountPoint.append(t)}escapeKeyHandler(t){t.defaultPrevented||"Escape"===t.key&&this.close()}open(){this.formConfigVars={...this.defaultConfigVars,...this.currentConfigVars},this.buildUI(),window.addEventListener("keydown",this.boundEscapeHandler)}close(){this.formConfigVars={},this.mountPoint.empty(),window.removeEventListener("keydown",this.boundEscapeHandler)}}},(t,e,n)=>{n.r(e),n.d(e,{default:()=>b});var a=n(8),s=n.n(a),o=n(9),i=n.n(o),r=n(10),l=n.n(r),d=n(11),c=n.n(d),p=n(12),u=n.n(p),g=n(13),h=n.n(g),m=n(19),f={};f.styleTagTransform=h(),f.setAttributes=c(),f.insert=l().bind(null,"head"),f.domAPI=i(),f.insertStyleElement=u();s()(m.default,f);const b=m.default&&m.default.locals?m.default.locals:void 0},(t,e,n)=>{n.r(e),n.d(e,{default:()=>r});var a=n(15),s=n.n(a),o=n(16),i=n.n(o)()(s());i.push([t.id,".nln-config-modal-background {\n  position: fixed;\n  top: 0;\n  left: 0;\n  margin: 0;\n  padding: 10px;\n  height: 100%;\n  width: 100%;\n  z-index: var(--zi-modals);\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  font-family: var(--theme-body-font-family);\n  font-size: var(--fs-body2);\n}\n.nln-config-modal-background .nln-config-modal {\n  overflow-y: auto;\n  max-height: 100%;\n  background-color: white;\n  color: black;\n  border: 1px solid black;\n  border-radius: 10px;\n  padding-top: 0.5em;\n  padding-bottom: 0.5em;\n}\n.nln-config-modal-background .nln-config-modal .nln-config-header {\n  border-bottom: 1px solid black;\n  padding: 0.25em;\n  display: flex;\n  align-content: center;\n}\n.nln-config-modal-background .nln-config-modal .nln-config-header .nln-header-text {\n  font-size: 2em;\n  padding-right: 0.25em;\n}\n.nln-config-modal-background .nln-config-modal .nln-config-header .nln-config-close-button {\n  background: none;\n  border: none;\n  font-size: 24pt;\n  cursor: pointer;\n}\n.nln-config-modal-background .nln-config-modal form fieldset {\n  display: flex;\n  flex-wrap: nowrap;\n  flex-direction: column;\n}\n.nln-config-modal-background .nln-config-modal form fieldset legend {\n  font-size: 1.5em;\n  background-color: black;\n  color: white;\n  width: 100%;\n  padding-left: 0.25em;\n}\n.nln-config-modal-background .nln-config-modal form fieldset .nln-field-row {\n  padding: 0.25em 10px;\n  display: flex;\n  flex-wrap: nowrap;\n  flex-direction: row;\n  align-items: center;\n}\n.nln-config-modal-background .nln-config-modal form fieldset .nln-field-row label {\n  padding-right: 10px;\n}\n.nln-config-modal-background .nln-config-modal form fieldset .nln-field-row input {\n  padding: 2px;\n  box-shadow: unset;\n  border-color: black;\n  color: black;\n}\n.nln-config-modal-background .nln-config-modal form .nln-config-buttons {\n  border-top: 1px solid black;\n  padding: 0.25em;\n  display: flex;\n  justify-content: right;\n}",""]);const r=i}],e={};function n(a){var s=e[a];if(void 0!==s)return s.exports;var o=e[a]={id:a,exports:{}};return t[a](o,o.exports,n),o.exports}n.n=t=>{var e=t&&t.__esModule?()=>t.default:()=>t;return n.d(e,{a:e}),e},n.d=(t,e)=>{for(var a in e)n.o(e,a)&&!n.o(t,a)&&Object.defineProperty(t,a,{enumerable:!0,get:e[a]})},n.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),n.r=t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})};var a={};(()=>{n.r(a);var t=n(1),e=n(2),s=n(4),o=n(5),i=n(6),r=n(17);!function(){const n=$('<div id="nln-flagging-dashboard-settings-modal"></div>');$("body").append(n);const a=new r.SettingsUI(n,{id:"NLN_Comment_Config",title:"NLN Comment Flagging Dashboard Settings",fields:{"API Information":{SITE_NAME:{label:"Site Name",type:"select",options:["stackoverflow"],default:"stackoverflow"},ACCESS_TOKEN:{label:"Access Token",type:"text",attributes:{size:25}},KEY:{label:"Key",type:"text",attributes:{size:25}},API_QUOTA_LIMIT:{label:"At what API quota should this script stop making new requests",type:"number",default:500,attributes:{step:1,min:0}},DELAY_BETWEEN_API_CALLS:{label:"How frequently (in seconds) should comments be fetched",type:"number",default:180,attributes:{step:1,min:60}}},"Run Information":{ACTIVE:{label:"Running",type:"checkbox",default:!1},RUN_IMMEDIATELY:{label:"Should run immediately on entering matched pages",type:"checkbox",default:!1},POST_TYPE:{label:"Types of post to consider",type:"select",options:["all","question","answer"],default:"all"},MAXIMUM_LENGTH_COMMENT:{label:"Maximum length comments to consider",type:"number",default:600,attributes:{step:1,min:15,max:600}},DISPLAY_CERTAINTY:{label:"How certain should the script be to display in UI (out of 100)",type:"number",default:25,attributes:{min:0,max:100,step:.01}},FILTER_WHITELIST:{label:"Do not display rows with any whitelist matches: ",type:"checkbox",default:!0}},"UI Settings":{DOCUMENT_TITLE_SHOULD_UPDATE:{label:"Update Title with number of pending comments for review: ",type:"checkbox",default:!0},TOTAL_NUMBER_OF_POSTS_IN_MEMORY:{label:"Display total number of comments in memory: ",type:"checkbox",default:!0},UI_DISPLAY_COMMENT_OWNER:{label:"Display User Name of Comment Author",type:"checkbox",default:!0},UI_DISPLAY_POST_TYPE:{label:"Display Type of Post the comment is under: ",type:"checkbox",default:!0},UI_DISPLAY_LINK_TO_COMMENT:{label:"Display Link to Comment: ",type:"checkbox",default:!0},UI_DISPLAY_BLACKLIST_MATCHES:{label:"Display Blacklist Matches: ",type:"checkbox",default:!0},UI_DISPLAY_WHITELIST_MATCHES:{label:"Display Whitelist Matches: ",type:"checkbox",default:!0},UI_DISPLAY_NOISE_RATIO:{label:"Display Noise Ratio: ",type:"checkbox",default:!0},UI_DISPLAY_FLAG_BUTTON:{label:"Display Flag button: ",type:"checkbox",default:!0},UI_DISPLAY_REMAINING_FLAGS:{label:"Display remaining flags (updated after flagging): ",type:"checkbox",default:!0},UI_DISPLAY_COMMENT_DELETE_STATE:{label:"Display If comment was deleted or not: ",type:"checkbox",default:!0}}}}),l=a.get("SITE_NAME"),d=a.get("ACCESS_TOKEN"),c=a.get("KEY");if(!d||!c)return void a.open();const p=$('<span title="NLN Comment Flagging Dashboard Settings" style="font-size:15pt;cursor: pointer;" class="s-topbar--item">⚙</span>');p.on("click",(()=>{a.open()}));const u=$("<li></li>");if(u.append(p),$("header ol.s-topbar--content > li:nth-child(2)").after(u),a.get("ACTIVE")){const n=`site=${l}&access_token=${d}&key=${c}`,r="!TQs**ij.viKR)b8Sie*Qd",p=1e3*a.get("DELAY_BETWEEN_API_CALLS"),u=StackExchange.options.user.fkey;let g=Math.floor(((0,t.getCurrentTimestamp)()-p)/1e3);const h=new i.Toast("NLN-Toast-Container"),m=new e.FlaggingDashboard($("#mainbar"),u,a,h);m.init();const f=async e=>{const i=Math.floor((0,t.getCurrentTimestamp)()/1e3),l=await(0,s.getComments)(n,r,g,i);if(l.quota_remaining<=a.get("API_QUOTA_LIMIT"))return h.open("Remaining API Threshold below limit. Stopping Script.","error",void 0),void window.clearInterval(e);l.items.length>0&&(g=i+1,m.addComments(l.items.reduce(((e,n)=>{const a=(0,t.htmlDecode)(n.body_markdown)||"",s=a.replace(/`.*`/g,"").match(o.blacklist)||[],i=(0,t.calcNoiseRatio)(s,a.replace(/\B@\w+/g,"").length);return e.push({can_flag:n.can_flag,body:n.body,body_markdown:n.body_markdown,owner:n.owner,link:n.link,_id:n.comment_id,post_id:n.post_id,post_type:n.post_type,blacklist_matches:s,whitelist_matches:a.match(o.whitelist)||[],noise_ratio:i}),e}),[])))};a.get("RUN_IMMEDIATELY")&&f();const b=window.setInterval((()=>f(b)),p)}}()})()})();