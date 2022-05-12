// ==UserScript==
// @name        NLN Comment Flagging Dashboard
// @description Find comments which may potentially be no longer needed and place them in a convenient flagging dashboard
// @homepage    https://github.com/HenryEcker/NLNCommentFlaggingDashboard
// @author      Henry Ecker (https://github.com/HenryEcker)
// @version     2.3.3
// @downloadURL https://github.com/HenryEcker/NLNCommentFlaggingDashboard/raw/master/dist/NLNCommentFlaggingDashboard.user.js
// @updateURL   https://github.com/HenryEcker/NLNCommentFlaggingDashboard/raw/master/dist/NLNCommentFlaggingDashboard.user.js
// @match       *://stackoverflow.com/users/flag-summary/15497888?group=4*
// @grant       GM_getValue
// @grant       GM_setValue
// ==/UserScript==
/* globals $, StackExchange */

(()=>{"use strict";var t=[,(t,e,n)=>{function a(t,e){return new RegExp(t.map((t=>t.source)).join("|"),e)}function o(t){return t.charAt(0).toUpperCase()+t.slice(1)}function s(t){return(new DOMParser).parseFromString(t,"text/html").documentElement.textContent}function i(t,e=2){return`${t.toFixed(e)}%`}function r(t,e){return t.reduce(((t,e)=>t+e.length),0)/e*100}function l(){return(new Date).getTime()}function d(t){return`${i(t.noise_ratio)} [${t.blacklist_matches.join(",")}] (${t.link})`}function c(t){return t/1e3+"s"}function p(t,e){return Object.entries(t).reduce(((t,[e,n])=>(t.set(e,n),t)),e)}function u(t){return p(t,new FormData)}function f(t){return p(t,new URLSearchParams)}n.r(e),n.d(e,{calcNoiseRatio:()=>r,capitalise:()=>o,formatCSSDuration:()=>c,formatComment:()=>d,formatPercentage:()=>i,getCurrentTimestamp:()=>l,getFormDataFromObject:()=>u,getURLSearchParamsFromObject:()=>f,htmlDecode:()=>s,mergeRegexes:()=>a})},(t,e,n)=>{n.r(e),n.d(e,{FlaggingDashboard:()=>i});var a=n(3),o=n(1),s=n(4);class i{constructor(t,e,n,a){this.htmlIds={containerDivId:"NLN_Comment_Wrapper",tableId:"NLN_Comment_Reports_Table",tableBodyId:"NLN_Comment_Reports_Table_Body",styleId:"nln-comment-userscript-styles",remainingFlags:"NLN_Remaining_Comment_Flags"},this.SO={CSS:{tableContainerDiv:"s-table-container",table:"s-table",buttonPrimary:"s-btn s-btn__primary",buttonGeneral:"s-btn",flagsRemainingDiv:"flex--item ml-auto fc-light",footer:"d-flex gs8 gsx ai-center"},HTML:{pendingSpan:'<span class="supernovabg mod-flag-indicator">pending</span>'}},this.mountPoint=t,this.flagsRemainingDiv=$(`<div class="${this.SO.CSS.flagsRemainingDiv}" id="${this.htmlIds.remainingFlags}"></div>`),this.fkey=e,this.uiConfig=n,this.toaster=a,this.tableData={}}init(){this.buildBaseStyles(),this.buildBaseUI()}buildBaseStyles(){const t=document.createElement("style");t.setAttribute("id",this.htmlIds.styleId),t.innerHTML=`\n#${this.htmlIds.containerDivId} {\n    padding: 25px 0;\n    display: grid;\n    grid-template-rows: 40px 1fr 40px;\n    grid-gap: 10px;\n}\n`,document.head.appendChild(t)}buildBaseUI(){const t=$(`<div id="${this.htmlIds.containerDivId}"></div>`);{const e=$('<div class="nln-header"></div>');e.append($("<h2>NLN Comment Flagging Dashboard</h2>")),t.append(e)}{const e=$(`<div class="${this.SO.CSS.tableContainerDiv}"></div>`),n=$(`<table id="${this.htmlIds.tableId}" class="${this.SO.CSS.table}"></table>`),a=$("<thead></thead>"),o=$("<tr></tr>");o.append($("<th>Comment Text</th>")),this.uiConfig.displayPostType&&o.append($("<th>Post Type</th>")),this.uiConfig.displayLink&&o.append($("<th>Link</th>")),this.uiConfig.displayBlacklistMatches&&o.append($("<th>Blacklist Matches</th>")),this.uiConfig.displayNoiseRatio&&o.append($("<th>Noise Ratio</th>")),this.uiConfig.displayFlagUI&&o.append($("<th>Flag</th>")),this.uiConfig.displayCommentDeleteState&&o.append($("<th>Deleted</th>")),o.append($("<th>Clear</th>")),a.append(o),n.append(a),n.append($(`<tbody id="${this.htmlIds.tableBodyId}"></tbody>`)),e.append(n),t.append(e)}{const e=$(`<div class="nln-footer ${this.SO.CSS.footer}"></div>`);{const t=$(`<button class="${this.SO.CSS.buttonPrimary}">Clear All</button>`);t.on("click",(()=>{this.tableData={},this.render()})),e.append(t);const n=$(`<button class="${this.SO.CSS.buttonGeneral}">Clear Handled</button>`);n.on("click",(()=>{this.tableData=Object.entries(this.tableData).reduce(((t,[e,n])=>(!n.can_flag||n?.was_flagged||n?.was_deleted||(t[e]=n),t)),{}),this.render()})),e.append(n)}e.append(this.flagsRemainingDiv),t.append(e)}this.mountPoint.before(t)}render(){const t=$(`#${this.htmlIds.tableBodyId}`);t.empty(),Object.values(this.tableData).forEach((e=>{const n=$("<tr></tr>");if(n.append(`<td>${e.body}</td>`),this.uiConfig.displayPostType&&n.append(`<td>${(0,o.capitalise)(e.post_type)}</td>`),this.uiConfig.displayLink&&n.append(`<td><a href="${e.link}" target="_blank">${e._id}</a></td>`),this.uiConfig.displayBlacklistMatches&&n.append(`<td>${e.blacklist_matches.map((t=>`"${t}"`)).join(", ")}</td>`),this.uiConfig.displayNoiseRatio&&n.append(`<td>${(0,o.formatPercentage)(e.noise_ratio)}</td>`),this.uiConfig.displayFlagUI)if(e.can_flag)if(e.was_flagged)n.append("<td>✓</td>");else{const t=$(`<button data-comment-id="${e._id}" class="${this.SO.CSS.buttonPrimary}">Flag</button>`);t.on("click",(()=>{t.text("Flagging..."),this.handleFlagComment(e)}));const a=$("<td></td>");a.append(t),n.append(a)}else n.append("<td>🚫</td>");this.uiConfig.displayCommentDeleteState&&(void 0!==e.was_deleted?e.was_deleted?n.append("<td>✓</td>"):n.append(`<td>${this.SO.HTML.pendingSpan}</td>`):n.append("<td></td>"));{const t=$(`<button class="${this.SO.CSS.buttonGeneral}">Clear</button>`);t.on("click",(()=>this.removeComment(e._id)));const a=$("<td></td>");a.append(t),n.append(a)}t.prepend(n)})),this.updatePageTitle()}async handleFlagComment(t){const e=await this.updateRemainingFlags(t._id);try{const n=await(0,s.flagComment)(this.fkey,t._id);this.tableData[t._id].was_flagged=n.was_flagged,this.tableData[t._id].was_deleted=n.was_deleted,void 0!==e&&this.setRemainingFlagDisplay(e-1)}catch(e){e instanceof a.RatedLimitedError?this.toaster.open("Flagging too fast!","error"):e instanceof a.AlreadyFlaggedError?(this.toaster.open(e.message,"warning",1e3),this.tableData[t._id].was_flagged=!0,this.tableData[t._id].was_deleted=!1):e instanceof a.AlreadyDeletedError?(this.toaster.open(e.message,"error",1e3),this.tableData[t._id].can_flag=!1,this.tableData[t._id].was_deleted=!0):(e instanceof a.OutOfFlagsError||e instanceof a.FlagAttemptFailed)&&(this.toaster.open(e.message,"error",8e3),this.tableData[t._id].can_flag=!1)}finally{this.render()}}addComments(t){t.length>0&&(this.updateRemainingFlags(t[0]._id),t.forEach((t=>{this.tableData[t._id]=t})),this.render())}removeComment(t){delete this.tableData[t],this.render()}updatePageTitle(){if(this.uiConfig.shouldUpdateTitle){const t=Object.values(this.tableData).reduce(((t,e)=>e.can_flag&&!e.was_flagged?t+1:t),0);let e=document.title.replace(/^\(\d+\)\s+/,"");t>0&&(e=`(${t}) ${e}`),document.title=e}}setRemainingFlagDisplay(t){this.flagsRemainingDiv.html(`<span title="The data is updated infrequently the number of flags may be inaccurate">You have ${t} flags left today</span>`)}async updateRemainingFlags(t){if(this.uiConfig.displayRemainingFlags)try{const e=await(0,s.getFlagQuota)(t);return this.setRemainingFlagDisplay(e),e}catch(t){return}}}},(t,e,n)=>{n.r(e),n.d(e,{AlreadyDeletedError:()=>r,AlreadyFlaggedError:()=>l,FlagAttemptFailed:()=>o,OutOfFlagsError:()=>i,RatedLimitedError:()=>s});class a extends Error{constructor(t){super(t),this.name=this.constructor.name}}class o extends a{}class s extends o{}class i extends o{}class r extends o{}class l extends o{}},(t,e,n)=>{n.r(e),n.d(e,{flagComment:()=>r,getComments:()=>s,getFlagQuota:()=>i});var a=n(1),o=n(3);function s(t,e,n,o){const s=(0,a.getURLSearchParamsFromObject)({pagesize:100,order:"desc",sort:"creation",filter:e,fromdate:n,...o&&{todate:o}});return fetch(`https://api.stackexchange.com/2.3/comments?${s.toString()}&${t}`).then((t=>t.json())).then((t=>t))}function i(t){return new Promise(((e,n)=>{$.get(`https://${location.hostname}/flags/comments/${t}/popup`).done((t=>{const n=/you have (\d+) flags left today/i,a=$('div:contains("flags left today")',t).filter(((t,e)=>0===e.childElementCount&&Boolean(e.innerText.match(n)))).last().text().match(n);return e(null!==a?Number(a[1]):0)})).fail((t=>409===t.status?n(new o.RatedLimitedError("You may only load the comment flag dialog every 3 seconds")):n()))}))}function r(t,e){return fetch(`https://${location.hostname}/flags/comments/${e}/add/39`,{method:"POST",body:(0,a.getFormDataFromObject)({fkey:t,otherText:"",overrideWarning:!0})}).then((t=>{if(409===t.status)throw new o.RatedLimitedError("You can only flag once every 5 seconds");if(200===t.status)return t.json();throw new o.FlagAttemptFailed(`Something unexpected went wrong. (${t.status}: "${t.statusText}")`)})).then((t=>{if(t.Success&&0===t.Outcome)return{was_deleted:t.ResultChangedState,was_flagged:!0};if(!t.Success&&2===t.Outcome){if("You have already flagged this comment"===t.Message)throw new o.AlreadyFlaggedError(t.Message);if("This comment is deleted and cannot be flagged"===t.Message)throw new o.AlreadyDeletedError(t.Message);if(t.Message.toLowerCase().includes("out of flag"))throw new o.OutOfFlagsError(t.Message)}throw new o.FlagAttemptFailed(t.Message)}))}},(t,e,n)=>{n.r(e),n.d(e,{FlagAttemptFailed:()=>r,RatedLimitedError:()=>l,blacklist:()=>o,whitelist:()=>s});var a=n(1);const o=(0,a.mergeRegexes)([/(?:[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/,/\s+((?=[!-~])[\W_]){2,}\s*/,/\b(?:t(?:y(?:sm|vm)?|hx)|ily(?:sm)?|k)\b/,/(?:happy|glad)\s*(?:\w+\s+)*?(he(?:ar|lp))/,/(?:you(r|['’]?re|\s+are)?|that['’]?s?)\s+(?:a(?:\s+rock\s+star|mazing|wesome)|incredible|brilliant|wonderful|rock|perfect)[.!]?/,/(?:Any\s+help\s+would\s+be\s+(?:a(?:ppreciated|wesome)|wonderful|great))/,/((?:\w+\s+)*?(?:looking\s*for)|that['’]?s?\s*it)[.!]?/,/(?:(this|that|it)?((['’]s?)|\s+((wa|i)s)\s+)?(\w+\s+)*?)what\s+(\w+\s+)*?need(?:ed|ing)?/,/(?:happy\s+coding)/,/(it(['’]?s)?|this)\s*((re)?solved?|fix(ed)?)\s*(((m[ey]|the)\s*(issue|problem))|it)/,/\b(?:b(?:ro(?:ther|o*)|ud(?:dy)?)|f(?:riend(?:io|o)?|am)|s(?:oldier|ir)|ma(?:te|n+)|amigo|homie|dude|pal)\b/,/(?:(?:big\s+|many\s+)?th?ank(?:s|\s*you|\s*u)?(?:\s+a lot|\s+(?:very|so) much|\s+a mil+ion|\s+)?(?:\s*for (?:your|the)?(?:\s+help)?)?|th?anx|thx|cheers)/,/(this|that|it|your)\s+(\w+\s+)*?work(?:ed|s)?\s*(?:now|perfectly|great|for me|(like|as) a charm)?/,/(?:(?:you(?:['’]?re?|\s+are)\s+)?welcome|my pleasure)+/,/(?:(?:I\s+)?(?:hope\s+)?(?:your\s+|(?:this\s+|that\s+|it\s+)(?:was\s+|is\s+)?)?(?:very\s+)?help(?:ful|ed|s)|useful(?:\s+a lot|\s+(?:very|so) much)?)+/,/(?:a(?:mazing|wesome)|br(?:illiant|avo)|excellent|fantastic|ingenious|marvelous|wonderful|perfect|superb|w+o+w+)/,/(?:you(?:['’]?re?|\s*are|['’]?ve|\s*have)?\s+)?(?:a\s+life\s+saver|sav(e|ed|ing)\s+(m[ey]|the|it))/,/(?:please(?:\s+\w+)*\s+)?accept(?:ed|ing)?\b(?:\s+the\s+answer)?/,/(?:please(?:\s+\w+)\s+)?(?:give an?\s+)?upvot(?:ed?|ing)(?:\s+the answer)?/,/(?:is|should be)(?:\s+\w+)*\s+(?:right|correct|accepted)(?:\s+\w+)*\s+(?:answer|solution)/],"gi"),s=(0,a.mergeRegexes)([/\b(?:n(?:eed|ot)|unfortunate(ly)?|persists?|require|but|unaccept(ed)?)\b/,/(?:d(?:o(?:esn(?:'t?|’t?|t)|n(?:'t?|’t?|t))|idn(?:'t?|’t?|t))|c(?:ouldn(?:'t?|’t?|t)|an(?:'t?|’t?|t))|ha(?:ven(?:'t?|’t?|t)|sn(?:'t?|’t?|t))|a(?:ren(?:'t?|’t?|t)|in(?:'t?|’t?|t))|shouldn(?:'t?|’t?|t)|wouldn(?:'t?|’t?|t)|isn(?:'t?|’t?|t))/,/\b(will|I'?ll)\s*try\b/,/[?]/],"gi");class i extends Error{constructor(t){super(t),this.name=this.constructor.name}}class r extends i{}class l extends i{}},(t,e,n)=>{n.r(e),n.d(e,{Toast:()=>o});n(7);var a=n(1);class o{constructor(t,e=450){this.toastMountPoint=$(`<div id="${t}"></div>`),$("body").append(this.toastMountPoint),this.openCloseDuration=e}open(t,e,n=5e3){const o=$(`<div class="nln-toast open ${e}"></div>`);o.css("animation-duration",(0,a.formatCSSDuration)(this.openCloseDuration));{const e=$(' <div class="toast-content"></div></div>');{const n=$(`<div class="toast-text"><span>${t}</span></div>`);e.append(n)}{const t=$('<div class="toast-close-wrapper"></div>'),n=$('<button title="close" class="toast-close-button">X</button>');n.on("click",(()=>this.close(o))),t.append(n),e.append(t)}o.append(e)}if(void 0!==n){const t=$('<div class="toast-progress-wrapper"></div>'),e=$('<div class="toast-progress"></div>');e.css("animation-delay",(0,a.formatCSSDuration)(this.openCloseDuration)),e.css("animation-duration",(0,a.formatCSSDuration)(n)),t.append(e),o.append(t),window.setTimeout((()=>{this.close(o)}),n+this.openCloseDuration)}this.toastMountPoint.append(o)}close(t){t.removeClass("open"),t.addClass("close"),window.setTimeout((()=>{t.remove()}),this.openCloseDuration)}}},(t,e,n)=>{n.r(e),n.d(e,{default:()=>b});var a=n(8),o=n.n(a),s=n(9),i=n.n(s),r=n(10),l=n.n(r),d=n(11),c=n.n(d),p=n(12),u=n.n(p),f=n(13),g=n.n(f),m=n(14),h={};h.styleTagTransform=g(),h.setAttributes=c(),h.insert=l().bind(null,"head"),h.domAPI=i(),h.insertStyleElement=u();o()(m.default,h);const b=m.default&&m.default.locals?m.default.locals:void 0},t=>{var e=[];function n(t){for(var n=-1,a=0;a<e.length;a++)if(e[a].identifier===t){n=a;break}return n}function a(t,a){for(var s={},i=[],r=0;r<t.length;r++){var l=t[r],d=a.base?l[0]+a.base:l[0],c=s[d]||0,p="".concat(d," ").concat(c);s[d]=c+1;var u=n(p),f={css:l[1],media:l[2],sourceMap:l[3],supports:l[4],layer:l[5]};if(-1!==u)e[u].references++,e[u].updater(f);else{var g=o(f,a);a.byIndex=r,e.splice(r,0,{identifier:p,updater:g,references:1})}i.push(p)}return i}function o(t,e){var n=e.domAPI(e);n.update(t);return function(e){if(e){if(e.css===t.css&&e.media===t.media&&e.sourceMap===t.sourceMap&&e.supports===t.supports&&e.layer===t.layer)return;n.update(t=e)}else n.remove()}}t.exports=function(t,o){var s=a(t=t||[],o=o||{});return function(t){t=t||[];for(var i=0;i<s.length;i++){var r=n(s[i]);e[r].references--}for(var l=a(t,o),d=0;d<s.length;d++){var c=n(s[d]);0===e[c].references&&(e[c].updater(),e.splice(c,1))}s=l}}},t=>{t.exports=function(t){var e=t.insertStyleElement(t);return{update:function(n){!function(t,e,n){var a="";n.supports&&(a+="@supports (".concat(n.supports,") {")),n.media&&(a+="@media ".concat(n.media," {"));var o=void 0!==n.layer;o&&(a+="@layer".concat(n.layer.length>0?" ".concat(n.layer):""," {")),a+=n.css,o&&(a+="}"),n.media&&(a+="}"),n.supports&&(a+="}");var s=n.sourceMap;s&&"undefined"!=typeof btoa&&(a+="\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(s))))," */")),e.styleTagTransform(a,t,e.options)}(e,t,n)},remove:function(){!function(t){if(null===t.parentNode)return!1;t.parentNode.removeChild(t)}(e)}}}},t=>{var e={};t.exports=function(t,n){var a=function(t){if(void 0===e[t]){var n=document.querySelector(t);if(window.HTMLIFrameElement&&n instanceof window.HTMLIFrameElement)try{n=n.contentDocument.head}catch(t){n=null}e[t]=n}return e[t]}(t);if(!a)throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");a.appendChild(n)}},(t,e,n)=>{t.exports=function(t){var e=n.nc;e&&t.setAttribute("nonce",e)}},t=>{t.exports=function(t){var e=document.createElement("style");return t.setAttributes(e,t.attributes),t.insert(e,t.options),e}},t=>{t.exports=function(t,e){if(e.styleSheet)e.styleSheet.cssText=t;else{for(;e.firstChild;)e.removeChild(e.firstChild);e.appendChild(document.createTextNode(t))}}},(t,e,n)=>{n.r(e),n.d(e,{default:()=>r});var a=n(15),o=n.n(a),s=n(16),i=n.n(s)()(o());i.push([t.id,".nln-toast {\n  box-sizing: content-box;\n  position: fixed;\n  top: calc(var(--theme-topbar-height) + 10px);\n  left: 50%;\n  border-radius: 6px;\n  overflow: hidden;\n}\n.nln-toast.error {\n  border: 1px solid var(--theme-content-border-color);\n  color: var(--theme-body-font-color);\n  background-color: rgba(255, 0, 0, 0.65);\n}\n.nln-toast.error .toast-close-button {\n  color: var(--theme-body-font-color);\n}\n.nln-toast.error .toast-progress-wrapper {\n  border-top: 1px solid var(--theme-content-border-color);\n}\n.nln-toast.error .toast-progress {\n  background-color: rgb(255, 0, 0);\n}\n.nln-toast.warning {\n  border: 1px solid var(--theme-content-border-color);\n  color: var(--theme-body-font-color);\n  background-color: rgba(244, 130, 37, 0.65);\n}\n.nln-toast.warning .toast-close-button {\n  color: var(--theme-body-font-color);\n}\n.nln-toast.warning .toast-progress-wrapper {\n  border-top: 1px solid var(--theme-content-border-color);\n}\n.nln-toast.warning .toast-progress {\n  background-color: hsl(27deg, 90%, 55%);\n}\n.nln-toast .toast-text {\n  padding: 1em;\n}\n.nln-toast .toast-content {\n  display: grid;\n  grid-template-columns: 1fr 0.25fr;\n}\n.nln-toast .toast-close-wrapper {\n  display: flex;\n  align-content: center;\n  justify-content: center;\n}\n.nln-toast .toast-close-button {\n  background: none;\n  border: none;\n  cursor: pointer;\n}\n.nln-toast .toast-progress-wrapper {\n  width: 100%;\n  height: 10px;\n  background-color: var(--theme-background-color);\n}\n.nln-toast .toast-progress {\n  width: 100%;\n  height: 100%;\n  animation-name: progressAnimate;\n  animation-direction: normal;\n  animation-fill-mode: forwards;\n  animation-timing-function: linear;\n}\n@keyframes progressAnimate {\n  0% {\n    width: 100%;\n  }\n  100% {\n    width: 0;\n  }\n}\n.nln-toast.open {\n  animation-name: fadeInDown;\n  animation-fill-mode: forwards;\n  animation-timing-function: ease-in-out;\n}\n@keyframes fadeInDown {\n  0% {\n    opacity: 0;\n    transform: translateY(-100px);\n  }\n  100% {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.nln-toast.close {\n  animation-name: fadeUpOut;\n  animation-fill-mode: forwards;\n  animation-timing-function: ease-in-out;\n}\n@keyframes fadeUpOut {\n  0% {\n    opacity: 1;\n    transform: translateY(0);\n  }\n  100% {\n    opacity: 0;\n    transform: translateY(-100px);\n  }\n}",""]);const r=i},t=>{t.exports=function(t){return t[1]}},t=>{t.exports=function(t){var e=[];return e.toString=function(){return this.map((function(e){var n="",a=void 0!==e[5];return e[4]&&(n+="@supports (".concat(e[4],") {")),e[2]&&(n+="@media ".concat(e[2]," {")),a&&(n+="@layer".concat(e[5].length>0?" ".concat(e[5]):""," {")),n+=t(e),a&&(n+="}"),e[2]&&(n+="}"),e[4]&&(n+="}"),n})).join("")},e.i=function(t,n,a,o,s){"string"==typeof t&&(t=[[null,t,void 0]]);var i={};if(a)for(var r=0;r<this.length;r++){var l=this[r][0];null!=l&&(i[l]=!0)}for(var d=0;d<t.length;d++){var c=[].concat(t[d]);a&&i[c[0]]||(void 0!==s&&(void 0===c[5]||(c[1]="@layer".concat(c[5].length>0?" ".concat(c[5]):""," {").concat(c[1],"}")),c[5]=s),n&&(c[2]?(c[1]="@media ".concat(c[2]," {").concat(c[1],"}"),c[2]=n):c[2]=n),o&&(c[4]?(c[1]="@supports (".concat(c[4],") {").concat(c[1],"}"),c[4]=o):c[4]="".concat(o)),e.push(c))}},e}},(t,e,n)=>{n.r(e),n.d(e,{SettingsUI:()=>a});n(18);class a{constructor(t,e){this.SO={CSS:{buttonPrimary:"s-btn s-btn__primary",buttonGeneral:"s-btn"}},this.mountPoint=t,this.config=e,this.defaultConfigVars=Object.values(e.fields).reduce(((t,e)=>(Object.entries(e).forEach((([e,n])=>{void 0!==n.default&&(t[e]=n.default)})),t)),{}),this.currentConfigVars=this.load(),this.formConfigVars={},this.boundEscapeHandler=this.escapeKeyHandler.bind(this)}load(){const t=GM_getValue(this.config.id);return t?JSON.parse(t):{}}save(){GM_setValue(this.config.id,JSON.stringify(this.currentConfigVars))}get(t){return void 0!==this.currentConfigVars[t]?this.currentConfigVars[t]:this.defaultConfigVars[t]}set(t,e){this.currentConfigVars[t]=e}buildSelect(t,e,n,a){const o=$("<select></select>");return o.attr("id",t),n.options.forEach((t=>{o.append($(`<option value="${t}">${t}</option>`))})),void 0!==a&&o.val(a.toString()),o.on("change",(t=>{this.formConfigVars[e]=t.target.value})),o}buildInput(t,e,n,a){const o=$("<input>");return o.attr("id",t),o.attr("type",n.type),void 0!==n.attributes&&Object.entries(n.attributes).forEach((([t,e])=>{o.attr(t,e.toString())})),void 0!==a&&("checkbox"===n.type&&!0===a?o.prop("checked",a):o.attr("value",a)),o.on("change",(t=>{const n=t.target;"checkbox"===n.type?this.formConfigVars[e]=n.checked:this.formConfigVars[e]="number"===n.type?Number(n.value):n.value})),o}buildFieldRow(t,e){const n=$('<div class="nln-field-row"></div>'),a=`${this.config.id}_${t}`,o=$(`<label id="${a}_label" for="${a}">${e.label}</label>`);n.append(o);const s=this.formConfigVars[t];return"select"===e.type?n.append(this.buildSelect(a,t,e,s)):n.append(this.buildInput(a,t,e,s)),n}buildHeaderUI(){const t=$('<div class="nln-config-header"></div>');t.append($(`<span class="nln-header-text">${this.config.title}</span>`));const e=$('<button class="nln-config-close-button" title="close this popup (or hit Esc)">×</button>');return e.on("click",(()=>this.close())),t.append(e),t}buildFormUI(){const t=$("<form></form>");Object.entries(this.config.fields).forEach((([e,n])=>{const a=$("<fieldset></fieldset>"),o=$(`<legend>${e}</legend>`);a.append(o),Object.entries(n).forEach((([t,e])=>{a.append(this.buildFieldRow(t,e))})),t.append(a)}));const e=$('<div class="nln-config-buttons"></div>'),n=$(`<button class="${this.SO.CSS.buttonPrimary}" type="submit" title="save the current settings and reload the page">Save and Reload</button>`),a=$(`<button class="${this.SO.CSS.buttonGeneral}" type="button" title="revert any changes to the last save point">Revert Changes</button>`),o=$(`<button class="${this.SO.CSS.buttonGeneral}" type="reset" title="reset all values to their defaults">Reset to default</button>`);return t.on("submit",(t=>{t.preventDefault(),this.currentConfigVars={...this.formConfigVars},this.save(),window.location.reload()})),a.on("click",(t=>{t.preventDefault(),this.formConfigVars={...this.defaultConfigVars,...this.currentConfigVars},this.buildUI()})),t.on("reset",(t=>{t.preventDefault(),this.formConfigVars={...this.defaultConfigVars},this.buildUI()})),e.append(o),e.append(a),e.append(n),t.append(e),t}buildUI(){this.mountPoint.empty();const t=$('<div class="nln-config-modal-background"></div>'),e=$('<div class="nln-config-modal"></div>');e.append(this.buildHeaderUI()),e.append(this.buildFormUI()),t.append(e),this.mountPoint.append(t)}escapeKeyHandler(t){t.defaultPrevented||"Escape"===t.key&&this.close()}open(){this.formConfigVars={...this.defaultConfigVars,...this.currentConfigVars},this.buildUI(),window.addEventListener("keydown",this.boundEscapeHandler)}close(){this.formConfigVars={},this.mountPoint.empty(),window.removeEventListener("keydown",this.boundEscapeHandler)}}},(t,e,n)=>{n.r(e),n.d(e,{default:()=>b});var a=n(8),o=n.n(a),s=n(9),i=n.n(s),r=n(10),l=n.n(r),d=n(11),c=n.n(d),p=n(12),u=n.n(p),f=n(13),g=n.n(f),m=n(19),h={};h.styleTagTransform=g(),h.setAttributes=c(),h.insert=l().bind(null,"head"),h.domAPI=i(),h.insertStyleElement=u();o()(m.default,h);const b=m.default&&m.default.locals?m.default.locals:void 0},(t,e,n)=>{n.r(e),n.d(e,{default:()=>r});var a=n(15),o=n.n(a),s=n(16),i=n.n(s)()(o());i.push([t.id,".nln-config-modal-background {\n  position: fixed;\n  top: 0;\n  left: 0;\n  margin: 0;\n  padding: 10px;\n  height: 100%;\n  width: 100%;\n  z-index: var(--zi-modals);\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  font-family: var(--theme-body-font-family);\n  font-size: var(--fs-body2);\n}\n.nln-config-modal-background .nln-config-modal {\n  overflow-y: auto;\n  max-height: 100%;\n  background-color: white;\n  color: black;\n  border: 1px solid black;\n  border-radius: 10px;\n  padding-top: 0.5em;\n  padding-bottom: 0.5em;\n}\n.nln-config-modal-background .nln-config-modal .nln-config-header {\n  border-bottom: 1px solid black;\n  padding: 0.25em;\n  display: flex;\n  align-content: center;\n}\n.nln-config-modal-background .nln-config-modal .nln-config-header .nln-header-text {\n  font-size: 2em;\n  padding-right: 0.25em;\n}\n.nln-config-modal-background .nln-config-modal .nln-config-header .nln-config-close-button {\n  background: none;\n  border: none;\n  font-size: 24pt;\n  cursor: pointer;\n}\n.nln-config-modal-background .nln-config-modal form fieldset {\n  display: flex;\n  flex-wrap: nowrap;\n  flex-direction: column;\n}\n.nln-config-modal-background .nln-config-modal form fieldset legend {\n  font-size: 1.5em;\n  background-color: black;\n  color: white;\n  width: 100%;\n  padding-left: 0.25em;\n}\n.nln-config-modal-background .nln-config-modal form fieldset .nln-field-row {\n  padding: 0.25em 10px;\n  display: flex;\n  flex-wrap: nowrap;\n  flex-direction: row;\n  align-items: center;\n}\n.nln-config-modal-background .nln-config-modal form fieldset .nln-field-row label {\n  padding-right: 10px;\n}\n.nln-config-modal-background .nln-config-modal form fieldset .nln-field-row input {\n  padding: 2px;\n  box-shadow: unset;\n  border-color: black;\n  color: black;\n}\n.nln-config-modal-background .nln-config-modal form .nln-config-buttons {\n  border-top: 1px solid black;\n  padding: 0.25em;\n  display: flex;\n  justify-content: right;\n}",""]);const r=i}],e={};function n(a){var o=e[a];if(void 0!==o)return o.exports;var s=e[a]={id:a,exports:{}};return t[a](s,s.exports,n),s.exports}n.n=t=>{var e=t&&t.__esModule?()=>t.default:()=>t;return n.d(e,{a:e}),e},n.d=(t,e)=>{for(var a in e)n.o(e,a)&&!n.o(t,a)&&Object.defineProperty(t,a,{enumerable:!0,get:e[a]})},n.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),n.r=t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})};var a={};(()=>{n.r(a);var t=n(1),e=n(2),o=n(4),s=n(5),i=n(6),r=n(17);!function(){const n=$('<div id="nln-flagging-dashboard-settings-modal"></div>');$("body").append(n);const a=new r.SettingsUI(n,{id:"NLN_Comment_Config",title:"NLN Comment Flagging Dashboard Settings",fields:{"API Information":{SITE_NAME:{label:"Site Name",type:"select",options:["stackoverflow"],default:"stackoverflow"},ACCESS_TOKEN:{label:"Access Token",type:"text",attributes:{size:25}},KEY:{label:"Key",type:"text",attributes:{size:25}},API_QUOTA_LIMIT:{label:"At what API quota should this script stop making new requests",type:"number",default:500,attributes:{step:1,min:0}},DELAY_BETWEEN_API_CALLS:{label:"How frequently (in seconds) should comments be fetched",type:"number",default:180,attributes:{step:1,min:60}}},"Run Information":{ACTIVE:{label:"Running",type:"checkbox",default:!1},RUN_IMMEDIATELY:{label:"Should run immediately on entering matched pages",type:"checkbox",default:!1},POST_TYPE:{label:"Types of post to consider",type:"select",options:["all","question","answer"],default:"all"},MAXIMUM_LENGTH_COMMENT:{label:"Maximum length comments to consider",type:"number",default:600,attributes:{step:1,min:15,max:600}},DISPLAY_CERTAINTY:{label:"How certain should the script be to display in UI (out of 100)",type:"number",default:25,attributes:{min:0,max:100,step:.01}}},"UI Settings":{DOCUMENT_TITLE_SHOULD_UPDATE:{label:"Update Title with number of pending comments for review: ",type:"checkbox",default:!0},UI_DISPLAY_POST_TYPE:{label:"Display Type of Post the comment is under: ",type:"checkbox",default:!0},UI_DISPLAY_LINK_TO_COMMENT:{label:"Display Link to Comment: ",type:"checkbox",default:!0},UI_DISPLAY_BLACKLIST_MATCHES:{label:"Display Blacklist Matches: ",type:"checkbox",default:!0},UI_DISPLAY_NOISE_RATIO:{label:"Display Noise Ratio: ",type:"checkbox",default:!0},UI_DISPLAY_FLAG_BUTTON:{label:"Display Flag button: ",type:"checkbox",default:!0},UI_DISPLAY_REMAINING_FLAGS:{label:"Display remaining flags (updated after flagging): ",type:"checkbox",default:!0},UI_DISPLAY_COMMENT_DELETE_STATE:{label:"Display If comment was deleted or not: ",type:"checkbox",default:!0}}}}),l=a.get("SITE_NAME"),d=a.get("ACCESS_TOKEN"),c=a.get("KEY");if(!d||!c)return void a.open();const p=$('<span title="NLN Comment Flagging Dashboard Settings" style="font-size:15pt;cursor: pointer;" class="s-topbar--item">⚙</span>');p.on("click",(()=>a.open()));const u=$("<li></li>");if(u.append(p),$("header ol.s-topbar--content > li:nth-child(2)").after(u),a.get("ACTIVE")){const n=`site=${l}&access_token=${d}&key=${c}`,r="!SVaJvZISgqg34qVVD)",p=1e3*a.get("DELAY_BETWEEN_API_CALLS"),u=StackExchange.options.user.fkey;let f=Math.floor(((0,t.getCurrentTimestamp)()-p)/1e3);const g=new i.Toast("NLN-Toast-Container"),m=new e.FlaggingDashboard($("#mainbar"),u,{displayLink:a.get("UI_DISPLAY_LINK_TO_COMMENT"),displayPostType:a.get("UI_DISPLAY_POST_TYPE"),displayNoiseRatio:a.get("UI_DISPLAY_NOISE_RATIO"),displayFlagUI:a.get("UI_DISPLAY_FLAG_BUTTON"),displayBlacklistMatches:a.get("UI_DISPLAY_BLACKLIST_MATCHES"),displayCommentDeleteState:a.get("UI_DISPLAY_COMMENT_DELETE_STATE"),shouldUpdateTitle:a.get("DOCUMENT_TITLE_SHOULD_UPDATE"),displayRemainingFlags:a.get("UI_DISPLAY_REMAINING_FLAGS")},g);m.init();const h=async e=>{const i=Math.floor((0,t.getCurrentTimestamp)()/1e3),l=await(0,o.getComments)(n,r,f,i);if(l.quota_remaining<=a.get("API_QUOTA_LIMIT"))return g.open("Remaining API Threshold below limit. Stopping Script.","error",void 0),void window.clearInterval(e);l.items.length>0&&(f=i+1,m.addComments(l.items.reduce(((e,n)=>{if(o=a.get("POST_TYPE"),i=n.post_type,("all"===o||o===i)&&n.body_markdown.length<=a.get("MAXIMUM_LENGTH_COMMENT")){const o=(0,t.htmlDecode)(n.body_markdown)||"",i=o.replace(/`.*`/g,"").match(s.blacklist);if(i&&!o.match(s.whitelist)){const s=(0,t.calcNoiseRatio)(i,o.replace(/\B@\w+/g,"").length);s>=a.get("DISPLAY_CERTAINTY")&&e.push({can_flag:n.can_flag,body:o,link:n.link,_id:n.comment_id,post_id:n.post_id,post_type:n.post_type,blacklist_matches:i,noise_ratio:s})}}var o,i;return e}),[])))};a.get("RUN_IMMEDIATELY")&&h();const b=window.setInterval((()=>h(b)),p)}}()})()})();