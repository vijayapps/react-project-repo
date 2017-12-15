/* eslint-disable max-len */
const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const AssetsPlugin = require('assets-webpack-plugin');
const ExtractCssChunks = require('extract-css-chunks-webpack-plugin');
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const DashboardPlugin = require('webpack-dashboard/plugin');

const __PWA_ENV__ = process.env.PWA_ENV;
const __PWA_PUBLIC_PATH__ = process.env.PWA_PUBLIC_PATH;
const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  cache: !isProd,

  entry: {
    main: './client/index.js',
    vendor: ['./client/vendor/js/modules.js', './client/vendor/css/base.css'],
  },

  output: {
    path: path.resolve('./build/client'),
    publicPath: __PWA_PUBLIC_PATH__,
    filename: isProd ? 'js/[name].[chunkhash:8].js' : 'js/[name].js',
    chunkFilename: isProd ? 'js/[name].[chunkhash:8].js' : 'js/[name].js',
  },

  resolve: {
    alias: {
      react: 'preact-compat',
      'react-dom': 'preact-compat',
    },
  },

  module: {
    rules: isProd ? [
      { test: /\.js$/, exclude: /node_modules/, use: ['babel-loader'] },
      { test: /\.css$/, loader: ExtractCssChunks.extract({ use: [{ loader: 'css-loader', options: { importLoaders: 1 } }, 'postcss-loader'] }) },
      { test: /\.(gif|png|jpe?g|svg|ico)$/i, use: [{ loader: 'file-loader', options: { name: 'images/[name].[hash:8].[ext]' } }] },
      { test: /\.(woff(2)?|ttf|otf|eot)(\?[a-z0-9=&.]+)?$/, use: [{ loader: 'url-loader', options: { limit: 1000, name: 'fonts/[name].[hash:8].[ext]' } }] },
    ] : [
      { test: /\.js$/, exclude: /node_modules/, use: ['babel-loader'] },
      { test: /\.css$/, use: ['style-loader', { loader: 'css-loader', options: { importLoaders: 1 } }, 'postcss-loader'] },
      { test: /\.(gif|png|jpe?g|svg|ico)$/i, use: [{ loader: 'file-loader', options: { name: 'images/[name].[ext]' } }] },
      { test: /\.(woff(2)?|ttf|otf|eot)(\?[a-z0-9=&.]+)?$/, use: [{ loader: 'url-loader', options: { limit: 1000, name: 'fonts/[name].[ext]' } }] },
    ],
  },

  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new CleanWebpackPlugin(['./build/client']),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': isProd ? '"production"' : '"development"',
      __BROWSER__: true,
      __PWA_ENV__: JSON.stringify(__PWA_ENV__),
      __LOCAL__: __PWA_ENV__ === 'local',
    }),
    new webpack.optimize.CommonsChunkPlugin({
      names: ['vendor', 'webpackManifest'],
      minChunks: Infinity,
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'main',
      children: true,
      minChunks: 2,
    }),
    new AssetsPlugin({
      filename: 'assetsManifest.json',
      path: path.resolve('./build/client'),
      prettyPrint: true,
    }),
    ...(isProd ? [
      new webpack.LoaderOptionsPlugin({
        minimize: true,
        debug: false,
      }),
      new webpack.HashedModuleIdsPlugin(),
      new webpack.optimize.ModuleConcatenationPlugin(),
      new webpack.optimize.UglifyJsPlugin({
        sourceMap: true,
        compress: {
          screw_ie8: true,
          warnings: false,
        },
        mangle: {
          screw_ie8: true,
        },
        output: {
          comments: false,
          screw_ie8: true,
        },
      }),
      new ExtractCssChunks('css/[name].[contenthash:8].css'),
      new CopyWebpackPlugin([
        { from: './client/manifest.json' },
        { from: './client/offline', to: 'offline/[name].00000001.[ext]' },
      ], { copyUnmodified: true }),
      new SWPrecacheWebpackPlugin({
        cacheId: 'pwa',
        filename: 'serviceWorker.js',
        staticFileGlobsIgnorePatterns: [/\.map$/, /\.json$/],
        importScripts: ['offline/offline.00000001.js'],
        dontCacheBustUrlsMatching: /./,
        minify: true,
      }),
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
        reportFilename: 'bundle-analysis.html',
      }),
    ] : [
      new webpack.NamedModulesPlugin(),
      new DashboardPlugin(),
    ]),
  ],

  devtool: isProd ? 'hidden-source-map' : 'inline-source-map',

  devServer: {
    contentBase: path.resolve('./build/client'),
    headers: { 'Access-Control-Allow-Origin': '*' },
    overlay: true,
    quiet: true,
  },
};
