const Path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');

const PRODUCTION = process.env.NODE_ENV === 'production';

let entries = {
    'jquery-datasource': Path.resolve(__dirname, 'src/jquery-datasource.js')
};

if (PRODUCTION) {
    entries['jquery-datasource.min'] = Path.resolve(__dirname, 'src/jquery-datasource.js');

}

module.exports = {
    mode: PRODUCTION ? 'production' : 'development',
    entry: entries,
    output: {
        path: Path.join(__dirname, 'dist'),
        filename: '[name].js'
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({
          include: /\.min\.js$/,
          extractComments: false,
        })]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        }),
    ],
    externals: {
        jquery: 'jQuery'
    },
    resolve: {
        alias: {
            '~': Path.resolve(__dirname, 'src')
        }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                include: Path.resolve(__dirname, 'src'),
                loader: 'babel-loader'
            },
        ]
    }
};