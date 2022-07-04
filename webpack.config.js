const path = require('path');
const userscriptInfo = require('./package.json');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const {buildTamperMonkeyPreamble} = require("./build_utils");

const UserScriptConfig = {
    'name': 'NLN Comment Flagging Dashboard',
    'description': userscriptInfo.description,
    'homepage': userscriptInfo.repository.homepage,
    'author': userscriptInfo.author,
    'version': userscriptInfo.version,
    'downloadURL': userscriptInfo.repository.dist_url,
    'updateURL': userscriptInfo.repository.dist_url,
    'match': '*://stackoverflow.com/users/flag-summary/15497888?group=4*',
    'grant': ['GM_getValue', 'GM_setValue']
}

const globals = ['$', 'StackExchange'];


module.exports = {
    entry: './src/Main.tsx',
    mode: 'production',
    target: 'node',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: './NLNCommentFlaggingDashboard.user.js'
    },
    resolve: {
        extensions: ['.webpack.js', '.ts', '.tsx', '.js']
    },
    plugins: [
        new CleanWebpackPlugin()
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
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({
            terserOptions: {
                ecma: 2021,
                module: true,
                toplevel: true,
                format: {
                    preamble: buildTamperMonkeyPreamble(UserScriptConfig, globals).replace(/^\s+/mg, '')
                }
            }
        })]
    }
}