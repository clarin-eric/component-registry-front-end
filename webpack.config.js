/*
 * Webpack development server configuration
 *
 * This file is set up for serving the webpak-dev-server, which will watch for changes and recompile as required if
 * the subfolder /webpack-dev-server/ is visited. Visiting the root will not automatically reload.
 */

'use strict';

var webpack = require('webpack');
var path = require('path');
//var bower_dir = __dirname + '/bower_components';
var bower_dir = path.resolve(__dirname, '/bower_components');

var config = {
  entry: [
      'webpack-dev-server/client?http://localhost:8000',
      'webpack/hot/only-dev-server',
      './src/scripts/app/app.jsx'
  ],

  output: {
    filename: 'main.js',
    publicPath: '/assets/'
  },

  cache: true,
  devtool: "source-map",

  stats: {
    colors: true,
    modules: true,
    reasons: true
  },

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
          exclude: [ path.resolve(__dirname, 'node_modules/') ],
          use: [{ loader: 'jshint-loader' }]
        }, {
            test: require.resolve("react"),
            use: [
                {
                    loader: 'expose',
                    options: 'React'
                }
            ]
        }, {
          test: /\.jsx$/,
          use: [
            { loader: 'react-hot-loader' },
            {
                loader: 'jsx-loader',
                options: 'harmony'
            }
          ]
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
          use: ['style-loader', 'css-loader']
        }, {
          test: /\.(png|jpg)$/,
          use: [
              {
                  loader: 'url-loader',
                  options: {
                      limit: 8192
                  }
              }
          ]
        }
    ]
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.LoaderOptionsPlugin({
        debug: true,
        console: true,
        addVendor: function(name, thePath) {
            this.resolve.alias[name] = thePath;
            this.module.noParse.push(new RegExp(thePath));
          }
     })
  ]

};

//config.addVendor('moduleName', bower_dir + '/module_dir/filename.js');

module.exports = config;
