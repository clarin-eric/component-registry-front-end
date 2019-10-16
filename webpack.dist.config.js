/*
 * Webpack distribution configuration
 *
 * This file is set up for serving the distribution version. It will be compiled to dist/ by default
 */
'use strict';

var webpack = require('webpack');
var path = require('path');

module.exports = {

  entry: './src/scripts/app/app.jsx',

  output: {
    publicPath: path.resolve(__dirname, 'assets'),
    path: path.resolve(__dirname, 'dist/assets'),
    filename: 'main.js'
  },

  devtool: false,

  stats: {
    colors: true,
    modules: true,
    reasons: false
  },

  plugins: [
    new webpack.optimize.AggressiveMergingPlugin(),
    new webpack.DefinePlugin({
      "process.env": {
         NODE_ENV: JSON.stringify("production")  // see http://stackoverflow.com/a/36285479
      }
    }),
    new webpack.LoaderOptionsPlugin({
        debug: false,
        console: false
     })
  ],

  resolve: {
    alias: {
      'lodash/cloneDeep$': 'lodash/lang/cloneDeep',
      'lodash/get$': 'lodash/object/get',
      'lodash/has$': 'lodash/object/has',
      'lodash/isEqual$': 'lodash/lang/isEqual',
      'lodash/find$': 'lodash/collection/find'
    },
    extensions: ['.js', '.jsx']
  },

  module: {
    rules: [
    {
      test: /.js$/,
      enforce: 'pre',
      exclude: [
        path.resolve(__dirname, 'node_modules/')
      ],
      use: [
      {
          loader: 'jshint-loader'
      }]
    }, {      test: /\.jsx$/,
      use: [
      {
          loader: 'jsx-loader',
          options: {
              harmony: true
          }
      }]
    }, {
      test: /\.(sass|scss)$/,
      use: [
          { loader: 'style-loader'},
          { loader: 'css-loader'},
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              indentedSyntax: false,
              outputStyle: 'expanded'
            }
          }
      ]
    }, {
      test: /\.css$/,
      use: [
          'style-loader',
          'css-loader'
      ]
    }, {
      test: /\.(png|jpg)$/,
      use: [
      {
          loader: 'url-loader',
          options: {
              limit: 8192
          }
      }]
    }
    ]
  }
};
