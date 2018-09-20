const path = require('path')
const merge = require('webpack-merge')
const baseConfig = require('./webpack.base.config')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin')
const UglifyjsWebpackPlugin = require('uglifyjs-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const config = merge(baseConfig, {
    entry: ['@babel/polyfill', './src/index.js'],
    output: {
        path: path.join(__dirname, '../dist'),
        filename: '[name].js'
    },
    plugins: [
        new CleanWebpackPlugin(['../dist']),
        new MiniCssExtractPlugin({
            filename: '[name].css'
        }),
        new OptimizeCssAssetsWebpackPlugin(),
        new BundleAnalyzerPlugin()
    ],
    optimization: {
        minimizer: [
            new UglifyjsWebpackPlugin({
                uglifyOptions: {
                    output: {
                        comments: false
                    }
                },
                // extractComments: true
            })
        ]
    }
})

module.exports = config