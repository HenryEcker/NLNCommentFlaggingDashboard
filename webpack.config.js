const path = require('path');
const webpack = require('webpack');
const userscriptInfo = require('./package.json');

module.exports = {
    entry: './src/main.ts',
    mode: 'none',
    target: 'node',
    output: {
        filename: './NLNCommentFlaggingDashboard.user.js'
    },
    resolve: {
        extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js']
    },
    plugins: [
        new webpack.BannerPlugin({
            raw: true,
            banner: `
// ==UserScript==
// @name         NLN Comment Flagging Dashboard
// @description  ${userscriptInfo.description}
// @homepage     ${userscriptInfo.repository.homepage}
// @author       ${userscriptInfo.author}
// @version      ${userscriptInfo.version}
// @downloadURL  ${userscriptInfo.repository.dist_url}
// @updateURL    ${userscriptInfo.repository.dist_url}
//
// @include      *://stackoverflow.com/users/flag-summary/15497888?group=4*
//
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-end
//
// ==/UserScript==
/* globals $, StackExchange, jQuery */\n`.replace(/^\s+/mg, '')
        })
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                include: path.resolve(__dirname, 'src'),
                loader: 'ts-loader'
            }
        ]
    }
}