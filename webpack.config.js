const path = require('path');
const webpack = require('webpack');
const userscriptInfo = require('./package.json');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');

module.exports = {
    entry: './src/Main.ts',
    mode: 'none',
    target: 'node',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: './NLNCommentFlaggingDashboard.user.js'
    },
    resolve: {
        extensions: ['.webpack.js', '.ts', '.tsx', '.js']
    },
    plugins: [
        new CleanWebpackPlugin(),
        new webpack.BannerPlugin({
            raw: true,
            include: /.user.js/, // only add banner to user.js files
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
/* globals $, StackExchange, $ */\n`.replace(/^\s+/mg, '')
        }),
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                include: path.resolve(__dirname, 'src'),
                loader: 'ts-loader'
            },
            {
                test: /\.s[ac]ss$/i,
                include: path.resolve(__dirname, 'src'),
                use: ['style-loader', 'css-loader', 'sass-loader']
            }
        ]
    }
}