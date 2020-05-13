const path = require('path');
const merge = require('webpack-merge');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const baseConfig = require('./webpack.base.config');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin');

const config = merge(baseConfig, {
  entry: ['./src/index.js'],
  output: {
    path: path.join(__dirname, '../dist'),
    filename: '[name].js',
  },
  plugins: [
    new CleanWebpackPlugin(['../dist']),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new OptimizeCssAssetsWebpackPlugin(),
  ],
  devtool: 'eval-source-map',
  devServer: {
    contentBase: path.join(__dirname, './dist'),
    compress: true, //gzip压缩
    watchContentBase: true,
    // hot: true,
    // hotOnly: true,
    inline: true,
    open: true,
    overlay: {
      warnings: false,
      errors: true,
    },
    port: 8088,
    disableHostCheck: true,
    host: '0.0.0.0',
    useLocalIp: true,
  },
});

module.exports = config;
