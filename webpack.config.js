/*
 * Webpack development server configuration
 *
 * This file is set up for serving the webpak-dev-server, which will watch for changes and recompile as required if
 * the subfolder /webpack-dev-server/ is visited. Visiting the root will not automatically reload.
 */

'use strict';

var webpack = require('webpack');
var bower_dir = __dirname + '/bower_components';

var config = {
  addVendor: function(name, path) {
    this.resolve.alias[name] = path;
    this.module.noParse.push(new RegExp(path));
  },

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
  debug: true,
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
    extensions: ['', '.js', '.jsx']
  },

  module: {
    noParse: [],
    preLoaders: [{
      test: '\\.js$',
      exclude: 'node_modules',
      loader: 'jshint'
    }],
    loaders: [{
      test: require.resolve("react"),
      loader: "expose?React"
    }, {
      test: /\.jsx$/,
      loader: 'react-hot!jsx-loader?harmony'
    }, {
      test: /\.json/,
      loader: 'json-loader'
    }, {
      test: /\.(sass|scss)/,
      loader: 'style-loader!css-loader!sass-loader'
    }, {
      test: /\.css$/,
      loader: 'style-loader!css-loader'
    }, {
      test: /\.(png|jpg)$/,
      loader: 'url-loader?limit=8192'
    }
  ]
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin()
//    ,
//    new webpack.NoErrorsPlugin()
  ]

};

//config.addVendor('moduleName', bower_dir + '/module_dir/filename.js');

module.exports = config;
